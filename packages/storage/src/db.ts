// ============================================================
// DevFlow Studio — SQLite Database Initialization
// ============================================================

import Database from 'better-sqlite3';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Store DB in user data dir: ~/.devflow-studio/devflow.sqlite
  const dataDir = join(homedir(), '.devflow-studio');
  mkdirSync(dataDir, { recursive: true });
  const dbPath = join(dataDir, 'devflow.sqlite');

  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // Create tables
  _db.exec(`
    CREATE TABLE IF NOT EXISTS flows (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      json        TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS executions (
      id          TEXT PRIMARY KEY,
      flow_id     TEXT NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
      status      TEXT NOT NULL DEFAULT 'pending',
      started_at  TEXT,
      finished_at TEXT,
      cpu_usage   REAL,
      memory_usage INTEGER,
      retry_count  INTEGER DEFAULT 0,
      duration_ms  INTEGER,
      log_json    TEXT DEFAULT '[]'
    );

    CREATE INDEX IF NOT EXISTS idx_executions_flow_id ON executions(flow_id);
  `);

  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
