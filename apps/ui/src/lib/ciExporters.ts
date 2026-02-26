// ============================================================
// DevFlow Studio — CI Pipeline Exporters
// Converts Visual DAG to YAML/Groovy templates.
// ============================================================

import type { Node, Edge } from 'reactflow';
import type { DevFlowNodeData } from '../store/flowStore.ts';

function sanitizeJobName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'job';
}

function getDependencies(nodeId: string, edges: Edge[]): string[] {
    return edges.filter(e => e.target === nodeId).map(e => e.source);
}

function getNodeCommand(node: Node<DevFlowNodeData>): string {
    const cfg = node.data.config as any;
    switch (node.data.nodeType) {
        case 'gitPull': return `git pull ${cfg.remote || 'origin'} ${cfg.branch || 'main'}`;
        case 'dockerBuild': return `docker build -t ${cfg.tag || 'myapp:latest'} ${cfg.context || '.'}`;
        case 'dockerRun': return `docker run ${cfg.detach ? '-d' : ''} -p ${cfg.ports || '3000:3000'} ${cfg.image || 'myapp:latest'}`;
        case 'dockerCompose': return `docker compose -f ${cfg.file || 'docker-compose.yml'} ${cfg.action || 'up'}`;
        case 'scriptRun': return cfg.command || 'echo "No command"';
        case 'npmRun': return `npm run ${cfg.script || 'build'}`;
        case 'pipInstall': return `pip install -r ${cfg.requirements || 'requirements.txt'}`;
        case 'makeTarget': return `make ${cfg.target || 'all'}`;
        case 'testRunner': return `npx jest ${cfg.pattern || ''}`;
        default: return `# Unsupported node type: ${node.data.nodeType}`;
    }
}

export function exportGitHubActions(nodes: Node<DevFlowNodeData>[], edges: Edge[], flowName: string): string {
    let yaml = `name: ${flowName}\n\non:\n  push:\n    branches: [ "main" ]\n  workflow_dispatch:\n\njobs:\n`;

    // Map of ID to sanitized job name
    const jobNames = new Map(nodes.map(n => [n.id, sanitizeJobName(n.data.label)]));

    nodes.forEach(node => {
        const jName = jobNames.get(node.id)!;
        const deps = getDependencies(node.id, edges).map(id => jobNames.get(id));

        yaml += `  ${jName}:\n`;
        yaml += `    runs-on: ubuntu-latest\n`;
        if (deps.length > 0) {
            yaml += `    needs: [${deps.map(n => `"${n}"`).join(', ')}]\n`;
        }
        yaml += `    steps:\n`;
        yaml += `      - uses: actions/checkout@v4\n`;
        yaml += `      - name: ${node.data.label}\n`;
        yaml += `        run: |\n          ${getNodeCommand(node).replace(/\n/g, '\n          ')}\n\n`;
    });

    return yaml;
}

export function exportGitLabCI(nodes: Node<DevFlowNodeData>[], edges: Edge[], _flowName: string): string {
    let yaml = `variables:\n  DOCKER_DRIVER: overlay2\n\n`;
    const jobNames = new Map(nodes.map(n => [n.id, sanitizeJobName(n.data.label)]));

    nodes.forEach(node => {
        const jName = jobNames.get(node.id)!;
        const deps = getDependencies(node.id, edges).map(id => jobNames.get(id));

        yaml += `${jName}:\n`;
        yaml += `  image: ubuntu:latest\n`;
        if (deps.length > 0) {
            yaml += `  needs: [${deps.map(n => `"${n}"`).join(', ')}]\n`;
        }
        yaml += `  script:\n`;
        yaml += `    - ${getNodeCommand(node)}\n\n`;
    });

    return yaml;
}

export function exportJenkinsPipeline(nodes: Node<DevFlowNodeData>[], _edges: Edge[], _flowName: string): string {
    // Jenkins Declarative doesn't natively do parallel DAG easily without scripted pipelines,
    // so we'll just output sequential stages. Topological sort simplifies this.
    // Extremely basic top-sort:
    const adj: Record<string, string[]> = {};
    const inDeg: Record<string, number> = {};
    nodes.forEach(n => { adj[n.id] = []; inDeg[n.id] = 0; });
    _edges.forEach(e => {
        if (adj[e.source]) adj[e.source].push(e.target);
        if (e.target in inDeg) inDeg[e.target]++;
    });

    let queue = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
    const sortedIds: string[] = [];
    while (queue.length > 0) {
        const temp = [...queue];
        queue = [];
        for (const id of temp) {
            sortedIds.push(id);
            for (const nxt of adj[id]) {
                inDeg[nxt]--;
                if (inDeg[nxt] === 0) queue.push(nxt);
            }
        }
    }

    let groovy = `pipeline {\n    agent any\n    options {\n        buildDiscarder(logRotator(numToKeepStr: '10'))\n        timeout(time: 1, unit: 'HOURS')\n    }\n    stages {\n`;

    for (const id of sortedIds) {
        const node = nodes.find(n => n.id === id)!;
        groovy += `        stage('${node.data.label.replace(/'/g, "\\'")}') {\n`;
        groovy += `            steps {\n`;
        groovy += `                sh '''\n`;
        groovy += `                    ${getNodeCommand(node)}\n`;
        groovy += `                '''\n`;
        groovy += `            }\n`;
        groovy += `        }\n`;
    }

    groovy += `    }\n}\n`;
    return groovy;
}

export function exportDockerCompose(nodes: Node<DevFlowNodeData>[], _edges: Edge[], _flowName: string): string {
    let yaml = `version: '3.8'\n\nservices:\n`;
    const jobNames = new Map(nodes.map(n => [n.id, sanitizeJobName(n.data.label)]));

    nodes.forEach(node => {
        const jName = jobNames.get(node.id)!;
        const cfg = node.data.config as any;

        yaml += `  ${jName}:\n`;
        if (node.data.nodeType === 'dockerRun' && cfg.image) {
            yaml += `    image: ${cfg.image}\n`;
            if (cfg.ports) yaml += `    ports:\n      - "${cfg.ports}"\n`;
        } else if (node.data.nodeType === 'npmRun') {
            yaml += `    image: node:18\n`;
            yaml += `    working_dir: /app\n`;
            yaml += `    volumes:\n      - .:/app\n`;
            yaml += `    command: npm run ${cfg.script || 'build'}\n`;
        } else {
            yaml += `    image: ubuntu:latest\n`;
            yaml += `    command: sh -c "${getNodeCommand(node).replace(/"/g, '\\"')}"\n`;
        }
        yaml += `\n`;
    });

    return yaml;
}
