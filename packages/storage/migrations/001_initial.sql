-- Migration 001: Initial schema
-- DevFlow Studio baseline tables

CREATE TABLE IF NOT EXISTS flows (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  json        TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS executions (
  id           TEXT PRIMARY KEY,
  flow_id      TEXT NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  started_at   TEXT,
  finished_at  TEXT,
  cpu_usage    REAL,
  memory_usage INTEGER,
  retry_count  INTEGER DEFAULT 0,
  duration_ms  INTEGER,
  log_json     TEXT DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_executions_flow_id ON executions(flow_id);
