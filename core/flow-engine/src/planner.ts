// ============================================================
// DevFlow Studio — Execution Planner
// Topological sort → batches of nodes that can run in parallel
// ============================================================

import type { FlowDefinition, ExecutionPlan } from './types.js';

export function generateExecutionPlan(flow: FlowDefinition): ExecutionPlan {
    const nodeIds = flow.nodes.map(n => n.id);
    const inDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};

    for (const id of nodeIds) {
        inDegree[id] = 0;
        adj[id] = [];
    }

    for (const edge of flow.edges) {
        if (adj[edge.source]) adj[edge.source].push(edge.target);
        if (edge.target in inDegree) inDegree[edge.target]++;
    }

    const plan: ExecutionPlan = [];
    let queue = nodeIds.filter(id => inDegree[id] === 0);

    while (queue.length > 0) {
        // Current batch — all nodes with no remaining dependencies
        plan.push([...queue]);
        const nextQueue: string[] = [];

        for (const nodeId of queue) {
            for (const neighbor of adj[nodeId] ?? []) {
                inDegree[neighbor]--;
                if (inDegree[neighbor] === 0) {
                    nextQueue.push(neighbor);
                }
            }
        }
        queue = nextQueue;
    }

    return plan;
}
