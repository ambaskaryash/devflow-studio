// ============================================================
// DevFlow Studio — Template Bridge
// Thin wrapper around core/detectors templates for use in UI
// (Replicated here to avoid monorepo import issues in Vite)
// ============================================================

import type { FlowDefinition, FlowNode, NodeType, NodeConfig } from './types.ts';

export type { FlowDefinition };

function node(
    id: string, type: NodeType, label: string,
    config: NodeConfig, position: { x: number; y: number }
): FlowNode {
    return { id, type, label, config, status: 'idle', position };
}

function edge(id: string, source: string, target: string) {
    return { id, source, target };
}

export function dockerOnlyTemplate(): FlowDefinition {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(), name: 'Docker Build & Run',
        description: 'Build and run a Docker container',
        createdAt: now, updatedAt: now,
        nodes: [
            node('node-git-1', 'gitPull', 'Git Pull', { remote: 'origin', branch: 'main' }, { x: 100, y: 150 }),
            node('node-build-1', 'dockerBuild', 'Docker Build', { context: '.', tag: 'myapp:latest', dockerfile: 'Dockerfile' }, { x: 380, y: 150 }),
            node('node-run-1', 'dockerRun', 'Docker Run', { image: 'myapp:latest', ports: ['3000:3000'], detach: true }, { x: 660, y: 150 }),
        ],
        edges: [edge('e-1', 'node-git-1', 'node-build-1'), edge('e-2', 'node-build-1', 'node-run-1')],
    };
}

export function scriptOnlyTemplate(): FlowDefinition {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(), name: 'Script Pipeline',
        description: 'Git pull and run scripts',
        createdAt: now, updatedAt: now,
        nodes: [
            node('node-git-1', 'gitPull', 'Git Pull', { remote: 'origin', branch: 'main' }, { x: 100, y: 150 }),
            node('node-install-1', 'scriptRun', 'Install', { command: 'npm install', shell: 'bash' }, { x: 380, y: 150 }),
            node('node-build-1', 'scriptRun', 'Build', { command: 'npm run build', shell: 'bash' }, { x: 660, y: 150 }),
        ],
        edges: [edge('e-1', 'node-git-1', 'node-install-1'), edge('e-2', 'node-install-1', 'node-build-1')],
    };
}

export function fullStackTemplate(): FlowDefinition {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(), name: 'Full Stack CI',
        description: 'Pull, install, test, dockerize',
        createdAt: now, updatedAt: now,
        nodes: [
            node('node-git-1', 'gitPull', 'Git Pull', { remote: 'origin', branch: 'main' }, { x: 80, y: 200 }),
            node('node-install-1', 'scriptRun', 'Install', { command: 'npm install', shell: 'bash' }, { x: 310, y: 200 }),
            node('node-test-1', 'scriptRun', 'Test', { command: 'npm test', shell: 'bash' }, { x: 540, y: 200 }),
            node('node-docker-1', 'dockerBuild', 'Docker Build', { context: '.', tag: 'app:latest' }, { x: 770, y: 200 }),
        ],
        edges: [
            edge('e-1', 'node-git-1', 'node-install-1'),
            edge('e-2', 'node-install-1', 'node-test-1'),
            edge('e-3', 'node-test-1', 'node-docker-1'),
        ],
    };
}
