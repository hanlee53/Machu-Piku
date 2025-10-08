import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// Han
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend')));

// Allow your local HTML page during dev. Replace with your domain in prod.
app.use(cors({ origin: true, credentials: true }));

// Supabase server client (uses service role; bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Helper: ensure a user row exists (id is a UUID string from the browser)
async function ensureUser(userId) {
  const { error } = await supabase
    .from('users')
    .upsert([{ id: userId }], { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw error;
}

// GET /pair  → return two random images
app.get('/pair', async (_req, res) => {
  const { data, error } = await supabase
    .from('images')
    .select('id, url, title')
    .order('created_at', { ascending: false }); // fetch many, randomize in JS for simplicity

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length < 2) return res.status(400).json({ error: 'Need at least 2 images' });

  // Simple random pick. 
  const i = Math.floor(Math.random() * data.length);
  let j = Math.floor(Math.random() * data.length);
  if (j === i) j = (j + 1) % data.length;

  const left = data[i];
  const right = data[j];

  res.json({ left, right });
});

// POST /vote  → save a vote row
app.post('/vote', async (req, res) => {
  try {
    const { userId, leftId, rightId, winnerId, decidedInMs } = req.body || {};
    if (!userId || !leftId || !rightId || !winnerId) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    if (winnerId !== leftId && winnerId !== rightId) {
      return res.status(400).json({ error: 'winnerId must be leftId or rightId' });
    }

    // create user row if not present
    await ensureUser(userId);

    // Insert one vote. Unique(user_id,pair_key) prevents duplicates for the same pair.
    const { error } = await supabase.from('votes').insert([{
      user_id: userId,
      left_image_id: leftId,
      right_image_id: rightId,
      winner_image_id: winnerId,
      decided_in_ms: decidedInMs ?? null
    }]);

    if (error) {
      // If duplicate pair vote: unique violation message contains 'duplicate key value'
      const isDuplicate = String(error.message).toLowerCase().includes('duplicate');
      return res.status(isDuplicate ? 200 : 500).json({
        ok: isDuplicate ? true : false,
        warning: isDuplicate ? 'Vote already recorded for this pair' : undefined,
        error: isDuplicate ? undefined : error.message
      });
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get('/me/votes', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const { data, error } = await supabase
    .from('votes')
    .select('created_at,left_image_id,right_image_id,winner_image_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ votes: data });
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
