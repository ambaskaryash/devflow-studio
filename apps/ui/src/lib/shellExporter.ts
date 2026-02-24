// DevFlow Studio — Shell Script Exporter
// Converts a DevFlow node graph into an executable bash script.

interface Node {
    id: string;
    data: {
        label: string;
        nodeType: string;
        config: Record<string, any>;
    };
}

interface Edge {
    source: string;
    target: string;
}

function nodeToCommand(node: Node, projectPath: string): string {
    const cfg = node.data.config;
    const cwd = projectPath || '.';

    switch (node.data.nodeType) {
        case 'gitPull':
            return `git -C "${cfg.directory || cwd}" pull ${cfg.remote || 'origin'} ${cfg.branch || 'main'}`;
        case 'dockerBuild':
            return `docker build -t "${cfg.tag || 'myapp:latest'}" -f "${cfg.dockerfile || 'Dockerfile'}" "${cfg.context || '.'}"`;
        case 'dockerRun': {
            const ports = typeof cfg.ports === 'string' ? cfg.ports : (cfg.ports || []).join(' -p ');
            const detach = cfg.detach ? '-d' : '';
            const remove = cfg.remove ? '--rm' : '';
            const name = cfg.name ? `--name ${cfg.name}` : '';
            return `docker run ${detach} ${remove} ${name} -p ${ports} "${cfg.image || 'myapp:latest'}"`.replace(/\s+/g, ' ').trim();
        }
        case 'dockerCompose':
            return `docker compose -f "${cfg.file || 'docker-compose.yml'}" ${cfg.action || 'up'}${cfg.detach ? ' -d' : ''}`;
        case 'npmRun': {
            const dir = cfg.packageDir ? `--prefix "${cfg.packageDir}"` : '';
            return `npm run ${cfg.script || 'build'} ${dir}`.trim();
        }
        case 'pipInstall':
            if (cfg.venv) {
                return `python -m venv "${cfg.venvDir || '.venv'}" && "${cfg.venvDir || '.venv'}/bin/pip" install -r "${cfg.requirements || 'requirements.txt'}"`;
            }
            return `pip install -r "${cfg.requirements || 'requirements.txt'}"`;
        case 'makeTarget':
            return `make -j${cfg.jobs || '4'} ${cfg.target || 'build'}`;
        case 'kubectlApply':
            return `kubectl apply -f "${cfg.manifest || 'k8s/'}" -n "${cfg.namespace || 'default'}"${cfg.dryRun ? ' --dry-run=client' : ''}`;
        case 'testRunner':
            switch (cfg.framework) {
                case 'pytest': return `pytest ${cfg.pattern || ''} ${cfg.coverage ? '--cov' : ''}`.trim();
                case 'go test': return `go test ./...`;
                case 'cargo test': return `cargo test`;
                case 'vitest': return `npx vitest run`;
                default: return `npx ${cfg.framework || 'jest'} ${cfg.pattern || ''} ${cfg.coverage ? '--coverage' : ''}`.trim();
            }
        case 'scriptRun':
            return String(cfg.command || '# no command');
        case 'delayNode':
            return `sleep ${cfg.seconds || 5}`;
        case 'notification':
            if (typeof window !== 'undefined' && 'Notification' in window) {
                return `echo "NOTIFY: ${cfg.title}: ${cfg.message}"`;
            }
            return `echo "${cfg.title}: ${cfg.message}"`;
        default:
            return `echo "Node: ${node.data.label}"`;
    }
}

export function exportAsShellScript(
    nodes: Node[],
    edges: Edge[],
    flowName: string,
    projectPath: string
): string {
    // Build adjacency for topological sort
    const adj: Record<string, string[]> = {};
    const inDeg: Record<string, number> = {};
    nodes.forEach(n => { adj[n.id] = []; inDeg[n.id] = 0; });
    edges.forEach(e => {
        adj[e.source]?.push(e.target);
        if (e.target in inDeg) inDeg[e.target]++;
    });

    // Topological sort (Kahn's algorithm)
    const queue = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
    const order: string[] = [];
    while (queue.length > 0) {
        const batch = [...queue];
        queue.length = 0;
        batch.forEach(id => {
            order.push(id);
            adj[id].forEach(next => {
                inDeg[next]--;
                if (inDeg[next] === 0) queue.push(next);
            });
        });
    }

    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
    const lines: string[] = [
        `#!/usr/bin/env bash`,
        `# ============================================================`,
        `# DevFlow Studio — Exported Script`,
        `# Flow: ${flowName}`,
        `# Exported: ${new Date().toISOString()}`,
        `# ============================================================`,
        `set -euo pipefail`,
        ``,
        `PROJECT_PATH="${projectPath || '.'}"`,
        `cd "$PROJECT_PATH"`,
        ``,
        `echo "▶ Starting flow: ${flowName}"`,
        ``,
    ];

    order.forEach((id, i) => {
        const node = nodeMap[id];
        if (!node) return;
        const cmd = nodeToCommand(node, projectPath);
        lines.push(`# Step ${i + 1}: ${node.data.label}`);
        lines.push(`echo "  → ${node.data.label}"`);
        lines.push(cmd);
        lines.push('');
    });

    lines.push(`echo "✅ Flow completed: ${flowName}"`);

    return lines.join('\n');
}
