-- Savio — schéma initial (MVP)
-- Conventions : identifiants texte (UUID côté client), dates ISO-8601 UTC, suppression logique,
-- journaux en ajout seul. Schéma volontairement compatible PostgreSQL pour la future synchronisation.

CREATE TABLE IF NOT EXISTS profile (
  id                 TEXT PRIMARY KEY,
  display_name       TEXT NOT NULL,
  ui_language        TEXT NOT NULL DEFAULT 'fr',
  daily_goal_minutes INTEGER NOT NULL DEFAULT 15,
  motivation         TEXT NOT NULL DEFAULT 'curiosity',
  long_term_goal     TEXT NOT NULL DEFAULT '',
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  subject_id  TEXT PRIMARY KEY,
  level       TEXT NOT NULL,
  enrolled_at TEXT NOT NULL,
  deleted_at  TEXT
);

CREATE TABLE IF NOT EXISTS skills (
  id         TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  title      TEXT NOT NULL
);

-- Graphe de connaissances : skill_id nécessite prerequisite_id.
CREATE TABLE IF NOT EXISTS skill_edges (
  skill_id        TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  prerequisite_id TEXT NOT NULL,
  PRIMARY KEY (skill_id, prerequisite_id)
);

CREATE TABLE IF NOT EXISTS review_items (
  id               TEXT PRIMARY KEY,
  subject_id       TEXT NOT NULL,
  skill_id         TEXT NOT NULL,
  kind             TEXT NOT NULL,
  front            TEXT NOT NULL,
  back             TEXT NOT NULL,
  note             TEXT,
  source           TEXT,
  stability        REAL NOT NULL DEFAULT 0,
  difficulty       REAL NOT NULL DEFAULT 0,
  reps             INTEGER NOT NULL DEFAULT 0,
  lapses           INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TEXT,
  due_at           TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  deleted_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_review_items_due ON review_items (reps, due_at);
CREATE INDEX IF NOT EXISTS idx_review_items_subject ON review_items (subject_id);

-- Journal immuable : l'état SRS peut être recalculé à partir de cette table.
CREATE TABLE IF NOT EXISTS review_logs (
  id               TEXT PRIMARY KEY,
  item_id          TEXT NOT NULL,
  subject_id       TEXT NOT NULL,
  skill_id         TEXT NOT NULL,
  rating           INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 4),
  reviewed_at      TEXT NOT NULL,
  response_ms      INTEGER NOT NULL,
  elapsed_days     REAL NOT NULL,
  stability_before REAL NOT NULL,
  stability_after  REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_review_logs_subject ON review_logs (subject_id, reviewed_at);

CREATE TABLE IF NOT EXISTS mistakes (
  id          TEXT PRIMARY KEY,
  subject_id  TEXT NOT NULL,
  skill_id    TEXT NOT NULL,
  tag         TEXT NOT NULL,
  expected    TEXT NOT NULL,
  given       TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mistakes_subject ON mistakes (subject_id);

CREATE TABLE IF NOT EXISTS daily_activity (
  day     TEXT PRIMARY KEY,
  minutes INTEGER NOT NULL DEFAULT 0,
  xp      INTEGER NOT NULL DEFAULT 0,
  reviews INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id         TEXT PRIMARY KEY,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  subject_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
