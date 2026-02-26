// ============================================================
// DevFlow Studio — Flow Version Repository (Frontend)
// CRUD for flow_versions table via Tauri IPC.
// ============================================================

import { getDb } from './db.ts';

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
export async function saveFlowVersion(params: {
    flowId: string;
    snapshotJson: string;
    commitMessage: string;
    nodeCount: number;
}): Promise<FlowVersion> {
    const db = await getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Auto-increment version_num per flow
    const rows = await db.select<{ max_v: number | null }[]>('SELECT MAX(version_num) as max_v FROM flow_versions WHERE flow_id = $1', [params.flowId]);
    const versionNum = (rows[0]?.max_v ?? 0) + 1;

    await db.execute(`
        INSERT INTO flow_versions (id, flow_id, version_num, commit_message, snapshot_json, node_count, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, params.flowId, versionNum, params.commitMessage, params.snapshotJson, params.nodeCount, now]);

    // Prune old versions: keep latest 50 per flow
    await db.execute(`
        DELETE FROM flow_versions WHERE flow_id = $1 AND id NOT IN (
            SELECT id FROM flow_versions WHERE flow_id = $2 ORDER BY version_num DESC LIMIT 50
        )
    `, [params.flowId, params.flowId]);

    return {
        id,
        flow_id: params.flowId,
        version_num: versionNum,
        commit_message: params.commitMessage,
        node_count: params.nodeCount,
        created_at: now
    };
}

/** List all versions for a flow (metadata only — no snapshot payload). */
export async function listFlowVersions(flowId: string): Promise<FlowVersion[]> {
    const db = await getDb();
    return await db.select<FlowVersion[]>(`
        SELECT id, flow_id, version_num, commit_message, node_count, created_at
        FROM flow_versions WHERE flow_id = $1 ORDER BY version_num DESC
    `, [flowId]);
}

/** Get a specific version including the full snapshot. */
export async function getFlowVersion(versionId: string): Promise<FlowVersionDetail | null> {
    const db = await getDb();
    const rows = await db.select<FlowVersionDetail[]>('SELECT * FROM flow_versions WHERE id = $1', [versionId]);
    return rows[0] || null;
}

/** Delete all versions for a flow (called on flow delete). */
export async function deleteFlowVersions(flowId: string): Promise<void> {
    const db = await getDb();
    await db.execute('DELETE FROM flow_versions WHERE flow_id = $1', [flowId]);
}

/**
 * Simple diff between two version snapshots.
 * Returns added, removed, and changed node labels.
 */
export async function diffFlowVersions(
    versionIdA: string,
    versionIdB: string
): Promise<{ added: string[]; removed: string[]; changed: string[] } | null> {
    const vA = await getFlowVersion(versionIdA);
    const vB = await getFlowVersion(versionIdB);
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
