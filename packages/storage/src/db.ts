// ============================================================
// DevFlow Studio — SQLite Database Initialization
// Uses versioned migration runner (PRAGMA user_version).
// ============================================================

import Database from 'better-sqlite3';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { runMigrations } from './migrationRunner.js';

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

  // Run all pending SQL migrations in order
  runMigrations(_db);

  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
