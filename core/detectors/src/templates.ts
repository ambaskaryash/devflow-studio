// ============================================================
// DevFlow Studio — Starter Flow Templates
// Pre-built node layouts for common project types
// ============================================================

import type { FlowDefinition } from '@devflow/flow-engine';

export function dockerOnlyTemplate(): FlowDefinition {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(),
        name: 'Docker Build & Run',
        description: 'Build and run a Docker container',
        createdAt: now,
        updatedAt: now,
        nodes: [
            {
                id: 'node-git-1',
                type: 'gitPull',
                label: 'Git Pull',
                status: 'idle',
                position: { x: 100, y: 150 },
                config: { remote: 'origin', branch: 'main' },
            },
            {
                id: 'node-build-1',
                type: 'dockerBuild',
                label: 'Docker Build',
                status: 'idle',
                position: { x: 350, y: 150 },
                config: { context: '.', tag: 'myapp:latest', dockerfile: 'Dockerfile' },
            },
            {
                id: 'node-run-1',
                type: 'dockerRun',
                label: 'Docker Run',
                status: 'idle',
                position: { x: 600, y: 150 },
                config: { image: 'myapp:latest', ports: ['3000:3000'], detach: true, remove: false },
            },
        ],
        edges: [
            { id: 'e-1', source: 'node-git-1', target: 'node-build-1' },
            { id: 'e-2', source: 'node-build-1', target: 'node-run-1' },
        ],
    };
}

export function scriptOnlyTemplate(): FlowDefinition {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(),
        name: 'Script Pipeline',
        description: 'Run custom build scripts',
        createdAt: now,
        updatedAt: now,
        nodes: [
            {
                id: 'node-git-1',
                type: 'gitPull',
                label: 'Git Pull',
                status: 'idle',
                position: { x: 100, y: 150 },
                config: { remote: 'origin', branch: 'main' },
            },
            {
                id: 'node-install-1',
                type: 'scriptRun',
                label: 'Install Dependencies',
                status: 'idle',
                position: { x: 350, y: 150 },
                config: { command: 'npm install', shell: 'bash' },
            },
            {
                id: 'node-build-1',
                type: 'scriptRun',
                label: 'Build',
                status: 'idle',
                position: { x: 600, y: 150 },
                config: { command: 'npm run build', shell: 'bash' },
            },
        ],
        edges: [
            { id: 'e-1', source: 'node-git-1', target: 'node-install-1' },
            { id: 'e-2', source: 'node-install-1', target: 'node-build-1' },
        ],
    };
}

export function fullStackTemplate(): FlowDefinition {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(),
        name: 'Full Stack CI',
        description: 'Pull, build, test, and containerize',
        createdAt: now,
        updatedAt: now,
        nodes: [
            {
                id: 'node-git-1',
                type: 'gitPull',
                label: 'Git Pull',
                status: 'idle',
                position: { x: 100, y: 200 },
                config: { remote: 'origin', branch: 'main' },
            },
            {
                id: 'node-install-1',
                type: 'scriptRun',
                label: 'Install',
                status: 'idle',
                position: { x: 320, y: 200 },
                config: { command: 'npm install', shell: 'bash' },
            },
            {
                id: 'node-test-1',
                type: 'scriptRun',
                label: 'Test',
                status: 'idle',
                position: { x: 540, y: 200 },
                config: { command: 'npm test', shell: 'bash' },
            },
            {
                id: 'node-docker-1',
                type: 'dockerBuild',
                label: 'Docker Build',
                status: 'idle',
                position: { x: 760, y: 200 },
                config: { context: '.', tag: 'app:latest' },
            },
        ],
        edges: [
            { id: 'e-1', source: 'node-git-1', target: 'node-install-1' },
            { id: 'e-2', source: 'node-install-1', target: 'node-test-1' },
            { id: 'e-3', source: 'node-test-1', target: 'node-docker-1' },
        ],
    };
}
