// ============================================================
// DevFlow Studio — Execution Repository (SQLite CRUD)
// ============================================================

import { getDb } from './db.js';

export interface StoredExecution {
    id: string;
    flow_id: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    started_at: string | null;
    finished_at: string | null;
    cpu_usage?: number;
    memory_usage?: number;
    retry_count?: number;
    duration_ms?: number;
    log_json: string;
}

export function recordExecution(exec: Omit<StoredExecution, 'started_at' | 'finished_at' | 'cpu_usage' | 'memory_usage' | 'retry_count' | 'duration_ms'>): void {
    const db = getDb();
    db.prepare(`
    INSERT INTO executions (id, flow_id, status, started_at, finished_at, log_json, retry_count)
    VALUES (?, ?, ?, NULL, NULL, ?, 0)
  `).run(exec.id, exec.flow_id, exec.status, exec.log_json);
}

export function updateExecutionStatus(
    id: string,
    status: StoredExecution['status'],
    finishedAt?: string,
): void {
    const db = getDb();
    if (finishedAt) {
        db.prepare('UPDATE executions SET status = ?, finished_at = ? WHERE id = ?').run(status, finishedAt, id);
    } else {
        db.prepare('UPDATE executions SET status = ?, started_at = ? WHERE id = ?').run(status, new Date().toISOString(), id);
    }
}

export function updateExecutionMetrics(
    id: string,
    metrics: { cpu: number; memory: number; duration: number; retries: number }
): void {
    const db = getDb();
    db.prepare(`
        UPDATE executions 
        SET cpu_usage = ?, memory_usage = ?, duration_ms = ?, retry_count = ?
        WHERE id = ?
    `).run(metrics.cpu, metrics.memory, metrics.duration, metrics.retries, id);
}

export function getExecutionHistory(flowId: string): StoredExecution[] {
    const db = getDb();
    return db.prepare(
        'SELECT * FROM executions WHERE flow_id = ? ORDER BY started_at DESC LIMIT 50',
    ).all(flowId) as StoredExecution[];
}
