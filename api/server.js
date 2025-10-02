import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import fs from "node:fs";
import path from "node:path";

const db = new Database(path.join(process.cwd(), "api", "app.db"));
db.exec(fs.readFileSync(path.join(process.cwd(), "api", "db", "schema.sql"), "utf8"));
db.exec(fs.readFileSync(path.join(process.cwd(), "api", "db", "seed.sql"), "utf8"));

const app = express();
app.use(cors());            // allow front-end from any origin in dev
app.use(express.json());

// util
const chunkPairs = (arr) => arr.reduce((a,_,i)=> i%2? a : [...a, arr.slice(i,i+2)], []);
const shuffle = (a) => { for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; };

// routes
app.get("/", (_,res)=>res.send("Tournament API is running"));

app.get("/contenders", (req, res) => {
  const rows = db.prepare(`SELECT id,name,image_url,seed FROM contenders ORDER BY COALESCE(seed,9999), name`).all();
  res.json(rows);
});

app.post("/tournaments", (req, res) => {
  const id = nanoid();
  const allowed = [2,4,8,16,32,64];
  const roundSize = Number(req.body.roundSize ?? 16);
  if (!allowed.includes(roundSize)) return res.status(400).json({ error: "roundSize must be 2,4,8,16,32,64" });

  let ids;
  if (Array.isArray(req.body.contenderIds) && req.body.contenderIds.length === roundSize) {
    const ph = req.body.contenderIds.map(()=>"?").join(",");
    ids = db.prepare(`SELECT id FROM contenders WHERE id IN (${ph})`).all(...req.body.contenderIds).map(r=>r.id);
  } else {
    ids = db.prepare(`SELECT id FROM contenders ORDER BY COALESCE(seed,9999), name LIMIT ?`).all(roundSize).map(r=>r.id);
  }

  db.prepare(`INSERT INTO tournaments(id,created_at,round_size) VALUES(?, datetime('now'), ?)`).run(id, roundSize);

  const pairs = chunkPairs(shuffle(ids));
  const insert = db.prepare(`INSERT INTO matches(id,tournament_id,round,left_id,right_id) VALUES(?,?,?,?,?)`);
  const tx = db.transaction(() => { for (const [L,R] of pairs) insert.run(nanoid(), id, roundSize, L, R); });
  tx();

  res.json({ id, round: roundSize });
});

app.get("/tournaments/:tid/matches", (req, res) => {
  const { tid } = req.params;
  const round = req.query.round ? Number(req.query.round) : null;
  const base = `SELECT id,round,left_id,right_id,winner_id FROM matches WHERE tournament_id=?`;
  const rows = round
    ? db.prepare(`${base} AND round=? ORDER BY id`).all(tid, round)
    : db.prepare(`${base} ORDER BY round DESC, id`).all(tid);
  res.json(rows);
});

app.patch("/matches/:mid/winner", (req, res) => {
  const { mid } = req.params;
  const { winnerId } = req.body;
  const m = db.prepare(`SELECT left_id,right_id,winner_id FROM matches WHERE id=?`).get(mid);
  if (!m) return res.status(404).json({ error: "Match not found" });
  if (m.winner_id) return res.status(409).json({ error: "Winner already set for this match" });
  if (winnerId !== m.left_id && winnerId !== m.right_id) {
    return res.status(400).json({ error: "winnerId must match left_id or right_id" });
  }
  db.prepare(`UPDATE matches SET winner_id=? WHERE id=?`).run(winnerId, mid);
  res.json({ ok: true });
});

app.post("/tournaments/:tid/advance", (req, res) => {
  const { tid } = req.params;
  const current = db.prepare(`SELECT round FROM matches WHERE tournament_id=? ORDER BY round DESC LIMIT 1`).get(tid);
  if (!current) return res.status(404).json({ error: "No matches yet" });
  if (current.round === 1) return res.status(400).json({ error: "Already at final" });

  const winners = db.prepare(`SELECT winner_id FROM matches WHERE tournament_id=? AND round=? ORDER BY id`).all(tid, current.round).map(r=>r.winner_id);
  if (winners.some(w => !w)) return res.status(400).json({ error: "Pick winners for all matches first" });

  const nextRound = current.round / 2;
  const insert = db.prepare(`INSERT INTO matches(id,tournament_id,round,left_id,right_id) VALUES(?,?,?,?,?)`);
  const tx = db.transaction(() => { for (const [L,R] of chunkPairs(winners)) insert.run(nanoid(), tid, nextRound, L, R); });
  tx();

  res.json({ round: nextRound, created: winners.length/2 });
});

app.post("/tournaments/:tid/finish", (req, res) => {
  const { tid } = req.params;
  const matches = db.prepare(`SELECT left_id,right_id,winner_id FROM matches WHERE tournament_id=?`).all(tid);
  if (!matches.length) return res.status(404).json({ error: "No matches" });

  const upsert = db.prepare(`
    INSERT INTO stats(contender_id,wins,plays) VALUES(?,?,?)
    ON CONFLICT(contender_id) DO UPDATE SET
      wins=wins+excluded.wins, plays=plays+excluded.plays
  `);
  const tx = db.transaction(() => {
    const plays = new Map();
    for (const { left_id, right_id } of matches) {
      plays.set(left_id, (plays.get(left_id)||0)+1);
      plays.set(right_id, (plays.get(right_id)||0)+1);
    }
    for (const [cid, n] of plays) upsert.run(cid, 0, n);
    for (const { winner_id } of matches) if (winner_id) upsert.run(winner_id, 1, 0);
  });
  tx();

  res.json({ ok: true });
});

app.get("/stats", (req, res) => {
  const rows = db.prepare(`
    SELECT s.contender_id, c.name, s.wins, s.plays,
           ROUND(CASE WHEN s.plays=0 THEN 0.0 ELSE 100.0*s.wins*1.0/s.plays END, 2) AS win_rate_pct
    FROM stats s JOIN contenders c ON c.id=s.contender_id
    ORDER BY win_rate_pct DESC, s.plays DESC
  `).all();
  res.json(rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`API on http://localhost:${PORT}`));
