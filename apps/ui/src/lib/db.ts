// ============================================================
// DevFlow Studio — Frontend SQLite Database Setup
// Connects to SQLite via Tauri IPC (@tauri-apps/plugin-sql).
// Includes lightweight migration runner.
// ============================================================

import Database from '@tauri-apps/plugin-sql';

let dbInstance: Database | null = null;

const MIGRATIONS = [
    // 001_initial
    `
    CREATE TABLE IF NOT EXISTS flows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        flow_id TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        metrics_json TEXT,
        FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_executions_flow_id ON executions(flow_id);
    `,
    // 002_add_versioning
    `
    CREATE TABLE IF NOT EXISTS flow_versions (
        id TEXT PRIMARY KEY,
        flow_id TEXT NOT NULL,
        version_num INTEGER NOT NULL,
        commit_message TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(flow_id) REFERENCES flows(id) ON DELETE CASCADE,
        UNIQUE(flow_id, version_num)
    );
    CREATE INDEX IF NOT EXISTS idx_flow_versions_flow_id ON flow_versions(flow_id);
    `,
    // 003_add_audit_log
    `
    CREATE TABLE IF NOT EXISTS execution_logs (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY(execution_id) REFERENCES executions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_execution_logs_exec_id ON execution_logs(execution_id);
    ALTER TABLE executions ADD COLUMN log_file_path TEXT;
    `
];

export async function getDb(): Promise<Database> {
    if (dbInstance) return dbInstance;

    try {
        dbInstance = await Database.load('sqlite:devflow.sqlite');

        // Run migrations
        const [{ user_version }] = await dbInstance.select<{ user_version: number }[]>('PRAGMA user_version;');
        if (user_version < MIGRATIONS.length) {
            console.log(`[DB] Migrating from version ${user_version} to ${MIGRATIONS.length}`);
            for (let i = user_version; i < MIGRATIONS.length; i++) {
                try {
                    // Try to execute the migration. 
                    // Note: ALTER TABLE might fail if column exists during a weird re-run state, but we ignore it.
                    const statements = MIGRATIONS[i].split(';').map(s => s.trim()).filter(Boolean);
                    for (const stmt of statements) {
                        try {
                            await dbInstance.execute(stmt);
                        } catch (err) {
                            console.warn(`[DB] Migration statement failed (continuing):`, err);
                        }
                    }
                    await dbInstance.execute(`PRAGMA user_version = ${i + 1};`);
                } catch (err) {
                    console.error(`[DB] Migration ${i + 1} failed:`, err);
                    throw err;
                }
            }
            console.log(`[DB] Migrations complete.`);
        }

        return dbInstance;
    } catch (err) {
        console.error('[DB] Failed to initialize database:', err);
        throw err;
    }
}
