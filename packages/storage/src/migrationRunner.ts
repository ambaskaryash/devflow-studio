// ============================================================
// DevFlow Studio — Migration Runner
// Applies versioned SQL migrations using PRAGMA user_version.
// Each migration file in /migrations/*.sql is run in order.
// ============================================================

import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

interface MigrationFile {
    version: number;
    filename: string;
    path: string;
}

/** Read and sort migration files from disk. */
function loadMigrationFiles(): MigrationFile[] {
    let files: string[];
    try {
        files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'));
    } catch {
        console.warn('[Migrations] No migrations directory found at', MIGRATIONS_DIR);
        return [];
    }

    return files
        .map(f => {
            const match = f.match(/^(\d+)_/);
            if (!match) return null;
            return { version: parseInt(match[1], 10), filename: f, path: join(MIGRATIONS_DIR, f) };
        })
        .filter((m): m is MigrationFile => m !== null)
        .sort((a, b) => a.version - b.version);
}

/**
 * Run all pending migrations against the given database.
 * Uses PRAGMA user_version to track applied migrations.
 * Each migration is wrapped in a transaction — rolls back on failure.
 */
export function runMigrations(db: Database.Database): void {
    const migrations = loadMigrationFiles();
    if (migrations.length === 0) {
        console.log('[Migrations] No migration files found, skipping.');
        return;
    }

    // PRAGMA user_version returns a single row with a 'user_version' key
    const currentVersion = (db.pragma('user_version', { simple: true }) as number) ?? 0;
    console.log(`[Migrations] Current schema version: ${currentVersion}`);

    const pending = migrations.filter(m => m.version > currentVersion);

    if (pending.length === 0) {
        console.log('[Migrations] Schema is up to date.');
        return;
    }

    for (const migration of pending) {
        console.log(`[Migrations] Applying migration ${migration.version}: ${migration.filename}`);

        let sql: string;
        try {
            sql = readFileSync(migration.path, 'utf-8');
        } catch (err) {
            throw new Error(`[Migrations] Failed to read ${migration.filename}: ${err}`);
        }

        // Some ALTERs cannot run inside a transaction on older SQLite,
        // so we split on statement boundaries and execute individually.
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        const applyMigration = db.transaction(() => {
            for (const stmt of statements) {
                try {
                    db.exec(stmt + ';');
                } catch (err: any) {
                    // SQLite raises "duplicate column" errors for ADD COLUMN
                    // when a column already exists on a re-run — safely ignore.
                    if (err?.message?.includes('duplicate column name')) {
                        console.warn(`[Migrations] Skipping already-applied: ${stmt.slice(0, 60)}...`);
                        continue;
                    }
                    throw err;
                }
            }
            // Bump user_version after successful migration
            db.pragma(`user_version = ${migration.version}`);
        });

        try {
            applyMigration();
            console.log(`[Migrations] ✅ Migration ${migration.version} applied.`);
        } catch (err) {
            throw new Error(`[Migrations] ❌ Migration ${migration.version} failed: ${err}`);
        }
    }

    const newVersion = db.pragma('user_version', { simple: true }) as number;
    console.log(`[Migrations] Schema updated to version ${newVersion}.`);
}
