// ============================================================
// DevFlow Studio — Dry Run Engine
// Simulates flow execution without running shell commands.
// Features: order validation, duration estimation, safety checks.
// ============================================================

import type { DryRunNodeResult } from './errorTypes.ts';
import { validateFlowSafety } from './safetyValidator.ts';
import { metricService } from './metricService.ts';

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

/**
 * Simulates a flow execution to preview the pipeline.
 * Does not spawn any actual processes.
 */
export async function runDryRun(nodes: Node[], edges: Edge[]): Promise<DryRunNodeResult[]> {
    if (nodes.length === 0) return [];

    // 1. Compute historical averages for duration estimation
    const averages = metricService.getAverages();

    // 2. Validate safety issues
    const safetyReports = validateFlowSafety(
        nodes.map(n => ({ id: n.id, label: n.data.label, nodeType: n.data.nodeType, config: n.data.config }))
    );
    const safetyMap = new Map(safetyReports.map(r => [r.nodeId, r.issues]));

    // 3. Topological sort to determine execution batches (same logic as executor)
    const adj: Record<string, string[]> = {};
    const inDeg: Record<string, number> = {};
    nodes.forEach(n => { adj[n.id] = []; inDeg[n.id] = 0; });
    edges.forEach(e => {
        if (adj[e.source]) adj[e.source].push(e.target);
        if (e.target in inDeg) inDeg[e.target]++;
    });

    let queue = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
    const results: DryRunNodeResult[] = [];
    let batchOrder = 0;

    // We do a mock dynamic import of shellExporter to get the command string
    // Since this is a UI tool, we can extract the `nodeToCommand` logic or
    // just use a simplified version for the preview.
    const { exportAsShellScript } = await import('./shellExporter.ts');

    // Quick hack to reuse shellExporter's unexported nodeToCommand logic:
    // We run the exporter on a single-node graph to get its output.
    const getCommand = (n: Node) => {
        const script = exportAsShellScript([n], [], 'mock', '.');
        const lines = script.split('\n');
        // The command is the last non-empty line before the completion echo
        const cmdLine = lines[lines.length - 3] || '...';
        return cmdLine.trim();
    };


    while (queue.length > 0) {
        const currentBatch = [...queue];
        queue = [];

        for (const nodeId of currentBatch) {
            const node = nodes.find(n => n.id === nodeId)!;
            const issues = safetyMap.get(nodeId) || [];

            // Estimate duration: try node_execution avg first, fallback to 1500ms
            const avgDuration = averages['node_execution'] ?? 1500;

            results.push({
                nodeId,
                nodeLabel: node.data.label,
                nodeType: node.data.nodeType,
                executionOrder: batchOrder,
                command: node.data.nodeType === 'delayNode' ? `sleep ${node.data.config.seconds ?? 5}` : getCommand(node),
                estimatedDurationMs: node.data.nodeType === 'delayNode' ? (node.data.config.seconds ?? 5) * 1000 : avgDuration,
                warnings: issues.map(i => ({ severity: i.severity, message: i.message }))
            });

            for (const neighbor of adj[nodeId]) {
                inDeg[neighbor]--;
                if (inDeg[neighbor] === 0) queue.push(neighbor);
            }
        }
        batchOrder++;
    }

    // Sort returning array by execution order, then alphabetically by label
    return results.sort((a, b) => {
        if (a.executionOrder !== b.executionOrder) return a.executionOrder - b.executionOrder;
        return a.nodeLabel.localeCompare(b.nodeLabel);
    });
}
