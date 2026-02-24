// ============================================================
// DevFlow Studio — Flow Validator
// Checks flows for cycles, missing configs, orphan nodes
// ============================================================

import type { FlowDefinition, ValidationResult } from './types.js';

function hasCycle(nodeIds: string[], edges: { source: string; target: string }[]): boolean {
    const adj: Record<string, string[]> = {};
    for (const id of nodeIds) adj[id] = [];
    for (const e of edges) {
        if (adj[e.source]) adj[e.source].push(e.target);
    }

    const visited = new Set<string>();
    const inStack = new Set<string>();

    function dfs(node: string): boolean {
        visited.add(node);
        inStack.add(node);
        for (const neighbor of adj[node] ?? []) {
            if (!visited.has(neighbor)) {
                if (dfs(neighbor)) return true;
            } else if (inStack.has(neighbor)) {
                return true;
            }
        }
        inStack.delete(node);
        return false;
    }

    for (const id of nodeIds) {
        if (!visited.has(id)) {
            if (dfs(id)) return true;
        }
    }
    return false;
}

export function validateFlow(flow: FlowDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const nodeIds = new Set(flow.nodes.map(n => n.id));

    // Must have at least one node
    if (flow.nodes.length === 0) {
        errors.push('Flow must contain at least one node.');
    }

    // All edge sources/targets must refer to existing nodes
    for (const edge of flow.edges) {
        if (!nodeIds.has(edge.source)) {
            errors.push(`Edge "${edge.id}" references unknown source node "${edge.source}".`);
        }
        if (!nodeIds.has(edge.target)) {
            errors.push(`Edge "${edge.id}" references unknown target node "${edge.target}".`);
        }
    }

    // Cycle detection
    if (hasCycle([...nodeIds], flow.edges)) {
        errors.push('Flow contains a cycle. Execution is not possible.');
    }

    // Check for nodes with no outputs that aren't the final node (warning only)
    const hasOutgoing = new Set(flow.edges.map(e => e.source));
    const hasIncoming = new Set(flow.edges.map(e => e.target));
    for (const node of flow.nodes) {
        if (!hasOutgoing.has(node.id) && !hasIncoming.has(node.id) && flow.nodes.length > 1) {
            warnings.push(`Node "${node.label}" (${node.id}) is disconnected from the flow.`);
        }
    }

    // Config validation per node type
    for (const node of flow.nodes) {
        if (node.type === 'dockerBuild') {
            const cfg = node.config as { context?: string; tag?: string };
            if (!cfg.context) errors.push(`Docker Build node "${node.label}": "context" is required.`);
            if (!cfg.tag) errors.push(`Docker Build node "${node.label}": "tag" is required.`);
        }
        if (node.type === 'dockerRun') {
            const cfg = node.config as { image?: string };
            if (!cfg.image) errors.push(`Docker Run node "${node.label}": "image" is required.`);
        }
        if (node.type === 'scriptRun') {
            const cfg = node.config as { command?: string };
            if (!cfg.command) errors.push(`Script node "${node.label}": "command" is required.`);
        }
    }

    return { valid: errors.length === 0, errors, warnings };
}
