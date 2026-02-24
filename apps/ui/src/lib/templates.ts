// DevFlow Studio — Flow Templates Library
// Pre-built workflow configurations for common DevOps use cases.

export interface FlowTemplate {
    id: string;
    name: string;
    description: string;
    category: 'docker' | 'node' | 'python' | 'kubernetes' | 'ci' | 'general';
    icon: string;
    nodes: any[];
    edges: any[];
}

// Helper to make node IDs unique on load
function uid(base: string) { return `${base}-${Math.random().toString(36).slice(2, 7)}`; }

export const FLOW_TEMPLATES: FlowTemplate[] = [
    {
        id: 'docker-deploy',
        name: 'Docker Deploy',
        description: 'Pull latest code, build Docker image and run container.',
        category: 'docker',
        icon: '🐳',
        nodes: [
            { id: 'n1', type: 'devflowNode', position: { x: 150, y: 100 }, data: { label: 'Git Pull', nodeType: 'gitPull', status: 'idle', config: { remote: 'origin', branch: 'main' } } },
            { id: 'n2', type: 'devflowNode', position: { x: 450, y: 100 }, data: { label: 'Docker Build', nodeType: 'dockerBuild', status: 'idle', config: { context: '.', tag: 'myapp:latest', dockerfile: 'Dockerfile' } } },
            { id: 'n3', type: 'devflowNode', position: { x: 750, y: 100 }, data: { label: 'Docker Run', nodeType: 'dockerRun', status: 'idle', config: { image: 'myapp:latest', ports: '3000:3000', detach: true, remove: true } } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
            { id: 'e2', source: 'n2', target: 'n3', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
        ],
    },
    {
        id: 'node-ci',
        name: 'Node.js CI',
        description: 'Pull, install dependencies, run tests, and build.',
        category: 'node',
        icon: '📦',
        nodes: [
            { id: 'n1', type: 'devflowNode', position: { x: 100, y: 150 }, data: { label: 'Git Pull', nodeType: 'gitPull', status: 'idle', config: { remote: 'origin', branch: 'main' } } },
            { id: 'n2', type: 'devflowNode', position: { x: 380, y: 150 }, data: { label: 'npm install', nodeType: 'npmRun', status: 'idle', config: { script: 'install', packageDir: '.' } } },
            { id: 'n3', type: 'devflowNode', position: { x: 660, y: 80 }, data: { label: 'npm test', nodeType: 'testRunner', status: 'idle', config: { framework: 'jest', pattern: '', coverage: true } } },
            { id: 'n4', type: 'devflowNode', position: { x: 660, y: 220 }, data: { label: 'npm build', nodeType: 'npmRun', status: 'idle', config: { script: 'build', packageDir: '.' } } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
            { id: 'e2', source: 'n2', target: 'n3', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
            { id: 'e3', source: 'n2', target: 'n4', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
        ],
    },
    {
        id: 'python-ml',
        name: 'Python ML Pipeline',
        description: 'Install deps, run training script, evaluate results.',
        category: 'python',
        icon: '🐍',
        nodes: [
            { id: 'n1', type: 'devflowNode', position: { x: 100, y: 150 }, data: { label: 'Git Pull', nodeType: 'gitPull', status: 'idle', config: { remote: 'origin', branch: 'main' } } },
            { id: 'n2', type: 'devflowNode', position: { x: 380, y: 150 }, data: { label: 'Pip Install', nodeType: 'pipInstall', status: 'idle', config: { requirements: 'requirements.txt', venv: true, venvDir: '.venv' } } },
            { id: 'n3', type: 'devflowNode', position: { x: 660, y: 150 }, data: { label: 'Train Model', nodeType: 'scriptRun', status: 'idle', config: { command: 'python train.py', shell: 'bash' } } },
            { id: 'n4', type: 'devflowNode', position: { x: 940, y: 150 }, data: { label: 'Evaluate', nodeType: 'scriptRun', status: 'idle', config: { command: 'python evaluate.py', shell: 'bash' } } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
            { id: 'e2', source: 'n2', target: 'n3', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
            { id: 'e3', source: 'n3', target: 'n4', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
        ],
    },
    {
        id: 'docker-compose-deploy',
        name: 'Docker Compose Deploy',
        description: 'Pull code and bring up full stack with Docker Compose.',
        category: 'docker',
        icon: '🐋',
        nodes: [
            { id: 'n1', type: 'devflowNode', position: { x: 150, y: 150 }, data: { label: 'Git Pull', nodeType: 'gitPull', status: 'idle', config: { remote: 'origin', branch: 'main' } } },
            { id: 'n2', type: 'devflowNode', position: { x: 450, y: 100 }, data: { label: 'Compose Down', nodeType: 'dockerCompose', status: 'idle', config: { action: 'down', file: 'docker-compose.yml', detach: false } } },
            { id: 'n3', type: 'devflowNode', position: { x: 450, y: 200 }, data: { label: 'Compose Build', nodeType: 'dockerCompose', status: 'idle', config: { action: 'build', file: 'docker-compose.yml', detach: false } } },
            { id: 'n4', type: 'devflowNode', position: { x: 750, y: 150 }, data: { label: 'Compose Up', nodeType: 'dockerCompose', status: 'idle', config: { action: 'up', file: 'docker-compose.yml', detach: true } } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
            { id: 'e2', source: 'n1', target: 'n3', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
            { id: 'e3', source: 'n2', target: 'n4', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
            { id: 'e4', source: 'n3', target: 'n4', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
        ],
    },
    {
        id: 'k8s-deploy',
        name: 'Kubernetes Deploy',
        description: 'Build image, push to registry, and apply k8s manifests.',
        category: 'kubernetes',
        icon: '☸️',
        nodes: [
            { id: 'n1', type: 'devflowNode', position: { x: 100, y: 150 }, data: { label: 'Git Pull', nodeType: 'gitPull', status: 'idle', config: { remote: 'origin', branch: 'main' } } },
            { id: 'n2', type: 'devflowNode', position: { x: 380, y: 150 }, data: { label: 'Docker Build', nodeType: 'dockerBuild', status: 'idle', config: { context: '.', tag: 'myapp:latest', dockerfile: 'Dockerfile' } } },
            { id: 'n3', type: 'devflowNode', position: { x: 660, y: 150 }, data: { label: 'Push Image', nodeType: 'scriptRun', status: 'idle', config: { command: 'docker push myapp:latest', shell: 'bash' } } },
            { id: 'n4', type: 'devflowNode', position: { x: 940, y: 150 }, data: { label: 'K8s Apply', nodeType: 'kubectlApply', status: 'idle', config: { manifest: 'k8s/', namespace: 'default', dryRun: false } } },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
            { id: 'e2', source: 'n2', target: 'n3', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
            { id: 'e3', source: 'n3', target: 'n4', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
        ],
    },
];

// Re-ID all nodes/edges to ensure uniqueness on each template load
export function instantiateTemplate(template: FlowTemplate): { nodes: any[]; edges: any[] } {
    const idMap: Record<string, string> = {};
    const nodes = template.nodes.map(n => {
        const newId = uid(n.data.nodeType);
        idMap[n.id] = newId;
        return { ...n, id: newId, data: { ...n.data, status: 'idle' } };
    });
    const edges = template.edges.map((e, i) => ({
        ...e,
        id: `e-${Date.now()}-${i}`,
        source: idMap[e.source] ?? e.source,
        target: idMap[e.target] ?? e.target,
    }));
    return { nodes, edges };
}
