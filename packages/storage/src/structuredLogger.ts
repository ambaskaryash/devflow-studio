// ============================================================
// DevFlow Studio — Structured Audit Logger
// Writes per-node log entries to the execution_logs table.
// Supports filtering, export, and retention pruning.
// ============================================================

import { getDb } from './db.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export type LogLevel = 'info' | 'stdout' | 'stderr' | 'error' | 'warn';

export interface LogEntry {
    id: string;
    execution_id: string;
    node_id: string;
    node_label: string;
    level: LogLevel;
    message: string;
    timestamp: string;
}

export interface LogFilter {
    level?: LogLevel;
    nodeId?: string;
    messageContains?: string;
}

/** Append a single structured log entry for an execution. */
export function logEntry(executionId: string, entry: Omit<LogEntry, 'id' | 'execution_id' | 'timestamp'>): void {
    const db = getDb();
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    db.prepare(`
        INSERT INTO execution_logs (id, execution_id, node_id, node_label, level, message, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, executionId, entry.node_id, entry.node_label, entry.level, entry.message, timestamp);
}

/** Batch-insert log entries efficiently (used for bulk imports from in-memory logs). */
export function batchLogEntries(executionId: string, entries: Array<Omit<LogEntry, 'id' | 'execution_id'>>): void {
    const db = getDb();
    const insert = db.prepare(`
        INSERT INTO execution_logs (id, execution_id, node_id, node_label, level, message, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const batchInsert = db.transaction(() => {
        for (const e of entries) {
            insert.run(crypto.randomUUID(), executionId, e.node_id, e.node_label, e.level, e.message, e.timestamp);
        }
    });
    batchInsert();
}

/** Retrieve log entries for an execution with optional filtering. */
export function getExecutionLogs(executionId: string, filter?: LogFilter): LogEntry[] {
    const db = getDb();
    let query = 'SELECT * FROM execution_logs WHERE execution_id = ?';
    const params: unknown[] = [executionId];

    if (filter?.level) {
        query += ' AND level = ?';
        params.push(filter.level);
    }
    if (filter?.nodeId) {
        query += ' AND node_id = ?';
        params.push(filter.nodeId);
    }
    if (filter?.messageContains) {
        query += ' AND message LIKE ?';
        params.push(`%${filter.messageContains}%`);
    }

    query += ' ORDER BY timestamp ASC';
    return db.prepare(query).all(...params) as LogEntry[];
}

/** Export all logs for an execution as a formatted JSON string. */
export function exportLogsAsJSON(executionId: string): string {
    const entries = getExecutionLogs(executionId);
    return JSON.stringify({ executionId, exportedAt: new Date().toISOString(), entries }, null, 2);
}

/**
 * Persist logs to a JSON file on disk.
 * Returns the absolute path to the file.
 */
export function persistLogsToFile(executionId: string): string {
    const logsDir = join(homedir(), '.devflow-studio', 'logs');
    mkdirSync(logsDir, { recursive: true });
    const filePath = join(logsDir, `${executionId}.json`);
    const content = exportLogsAsJSON(executionId);
    writeFileSync(filePath, content, 'utf-8');
    return filePath;
}

/**
 * Delete log entries older than `retentionDays` days.
 * Runs against the execution_logs table timestamp column.
 */
export function pruneOldLogs(retentionDays: number = 30): number {
    const db = getDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffISO = cutoff.toISOString();

    const result = db.prepare(`
        DELETE FROM execution_logs WHERE timestamp < ?
    `).run(cutoffISO);

    return result.changes;
}
