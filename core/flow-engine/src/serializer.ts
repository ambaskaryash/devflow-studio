// ============================================================
// DevFlow Studio — Flow Serializer
// JSON schema I/O for saving/loading flow definitions
// ============================================================

import type { FlowDefinition } from './types.js';

const SCHEMA_VERSION = '1.0.0';

export interface SerializedFlow {
    $schema: string;
    version: string;
    flow: FlowDefinition;
}

export function serializeFlow(flow: FlowDefinition): string {
    const payload: SerializedFlow = {
        $schema: 'https://devflow-studio.dev/schemas/flow/v1',
        version: SCHEMA_VERSION,
        flow: {
            ...flow,
            updatedAt: new Date().toISOString(),
        },
    };
    return JSON.stringify(payload, null, 2);
}

export function deserializeFlow(json: string): FlowDefinition {
    let parsed: SerializedFlow;
    try {
        parsed = JSON.parse(json) as SerializedFlow;
    } catch {
        throw new Error('Invalid flow JSON: failed to parse.');
    }

    if (!parsed.flow) {
        throw new Error('Invalid flow JSON: missing "flow" property.');
    }

    // Basic shape validation
    const { flow } = parsed;
    if (!flow.id || !flow.name || !Array.isArray(flow.nodes) || !Array.isArray(flow.edges)) {
        throw new Error('Invalid flow JSON: missing required fields (id, name, nodes, edges).');
    }

    return flow;
}

export function createEmptyFlow(name: string): FlowDefinition {
    return {
        id: crypto.randomUUID(),
        name,
        description: '',
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
