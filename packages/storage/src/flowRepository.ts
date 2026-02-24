// ============================================================
// DevFlow Studio — Flow Repository (SQLite CRUD)
// ============================================================

import { getDb } from './db.js';

export interface StoredFlow {
    id: string;
    name: string;
    description: string;
    json: string;
    created_at: string;
    updated_at: string;
}

export function saveFlow(flow: { id: string; name: string; description?: string; json: string }): void {
    const db = getDb();
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM flows WHERE id = ?').get(flow.id);

    if (existing) {
        db.prepare(`
      UPDATE flows SET name = ?, description = ?, json = ?, updated_at = ? WHERE id = ?
    `).run(flow.name, flow.description ?? '', flow.json, now, flow.id);
    } else {
        db.prepare(`
      INSERT INTO flows (id, name, description, json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(flow.id, flow.name, flow.description ?? '', flow.json, now, now);
    }
}

export function loadFlow(id: string): StoredFlow | null {
    const db = getDb();
    return (db.prepare('SELECT * FROM flows WHERE id = ?').get(id) as StoredFlow | undefined) ?? null;
}

export function listFlows(): StoredFlow[] {
    const db = getDb();
    return db.prepare('SELECT * FROM flows ORDER BY updated_at DESC').all() as StoredFlow[];
}

export function deleteFlow(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM flows WHERE id = ?').run(id);
}
