PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS contenders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  seed INTEGER
);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  round_size INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  left_id TEXT NOT NULL,
  right_id TEXT NOT NULL,
  winner_id TEXT,
  FOREIGN KEY(tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY(left_id) REFERENCES contenders(id),
  FOREIGN KEY(right_id) REFERENCES contenders(id),
  FOREIGN KEY(winner_id) REFERENCES contenders(id)
);

CREATE TABLE IF NOT EXISTS stats (
  contender_id TEXT PRIMARY KEY,
  wins INTEGER NOT NULL DEFAULT 0,
  plays INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(contender_id) REFERENCES contenders(id)
);
