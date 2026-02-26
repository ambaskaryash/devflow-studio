// ============================================================
// DevFlow Studio — Flow Version Repository
// CRUD for flow_versions table (git-like snapshots).
// ============================================================

import { getDb } from './db.js';

export interface FlowVersion {
    id: string;
    flow_id: string;
    version_num: number;
    commit_message: string;
    node_count: number;
    created_at: string;
}

export interface FlowVersionDetail extends FlowVersion {
    snapshot_json: string;
}

/** Save a new version snapshot for a flow. */
export function saveFlowVersion(params: {
    flowId: string;
    snapshotJson: string;
    commitMessage: string;
    nodeCount: number;
}): FlowVersion {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Auto-increment version_num per flow
    const row = db
        .prepare('SELECT COALESCE(MAX(version_num), 0) as max_v FROM flow_versions WHERE flow_id = ?')
        .get(params.flowId) as { max_v: number };

    const versionNum = row.max_v + 1;

    db.prepare(`
        INSERT INTO flow_versions (id, flow_id, version_num, commit_message, snapshot_json, node_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, params.flowId, versionNum, params.commitMessage, params.snapshotJson, params.nodeCount, now);

    // Prune old versions: keep latest 50 per flow
    db.prepare(`
        DELETE FROM flow_versions WHERE flow_id = ? AND id NOT IN (
            SELECT id FROM flow_versions WHERE flow_id = ? ORDER BY version_num DESC LIMIT 50
        )
    `).run(params.flowId, params.flowId);

    return { id, flow_id: params.flowId, version_num: versionNum, commit_message: params.commitMessage, node_count: params.nodeCount, created_at: now };
}

/** List all versions for a flow (metadata only — no snapshot payload). */
export function listFlowVersions(flowId: string): FlowVersion[] {
    const db = getDb();
    return db.prepare(`
        SELECT id, flow_id, version_num, commit_message, node_count, created_at
        FROM flow_versions WHERE flow_id = ? ORDER BY version_num DESC
    `).all(flowId) as FlowVersion[];
}

/** Get a specific version including the full snapshot. */
export function getFlowVersion(versionId: string): FlowVersionDetail | null {
    const db = getDb();
    return (db.prepare('SELECT * FROM flow_versions WHERE id = ?').get(versionId) as FlowVersionDetail | undefined) ?? null;
}

/** Delete all versions for a flow (called on flow delete). */
export function deleteFlowVersions(flowId: string): void {
    const db = getDb();
    db.prepare('DELETE FROM flow_versions WHERE flow_id = ?').run(flowId);
}

/**
 * Simple diff between two version snapshots.
 * Returns added, removed, and changed node labels.
 */
export function diffFlowVersions(
    versionIdA: string,
    versionIdB: string
): { added: string[]; removed: string[]; changed: string[] } | null {
    const vA = getFlowVersion(versionIdA);
    const vB = getFlowVersion(versionIdB);
    if (!vA || !vB) return null;

    let nodesA: Array<{ id: string; data: { label: string; config: unknown } }> = [];
    let nodesB: Array<{ id: string; data: { label: string; config: unknown } }> = [];

    try {
        nodesA = JSON.parse(vA.snapshot_json)?.nodes ?? [];
        nodesB = JSON.parse(vB.snapshot_json)?.nodes ?? [];
    } catch {
        return null;
    }

    const mapA = new Map(nodesA.map(n => [n.id, n]));
    const mapB = new Map(nodesB.map(n => [n.id, n]));

    const added: string[] = [];
    const removed: string[] = [];
    const changed: string[] = [];

    for (const [id, nodeB] of mapB) {
        if (!mapA.has(id)) {
            added.push(nodeB.data.label);
        } else {
            const configA = JSON.stringify(mapA.get(id)!.data.config);
            const configB = JSON.stringify(nodeB.data.config);
            if (configA !== configB) changed.push(nodeB.data.label);
        }
    }

    for (const [id, nodeA] of mapA) {
        if (!mapB.has(id)) removed.push(nodeA.data.label);
    }

    return { added, removed, changed };
}
