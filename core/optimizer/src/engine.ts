// ============================================================
// DevFlow Studio — Smart Workflow Optimizer Engine (Phase 4)
// Rule-based heuristics for flow optimization.
// ============================================================

export interface OptimizationSuggestion {
    id: string;
    type: 'parallel' | 'performance' | 'reliability';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    targetNodeIds?: string[];
}

export function analyzeFlow(nodes: any[], edges: any[], history: any[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 1. Detect Parallelization Opportunities
    // Logic: Look for sequential nodes that don't have data dependencies (simplified for rule-based)
    // Here we just look for long chains that could potentially be split if independent
    if (nodes.length > 3 && edges.length >= nodes.length - 1) {
        const isLinear = edges.every(e => edges.filter(ee => ee.source === e.source).length === 1);
        if (isLinear) {
            suggestions.push({
                id: 'opt_parallel_01',
                type: 'parallel',
                title: 'Parallelization Opportunity',
                description: 'Your flow is purely sequential. Consider branching independent tasks to reduce total execution time.',
                impact: 'high'
            });
        }
    }

    // 2. Performance Bottlenecks
    // Logic: Analyze history for nodes that consistently take > 70% of total flow time
    const avgTotalTime = history.reduce((acc, h) => acc + (h.durationMs || 0), 0) / (history.length || 1);

    nodes.forEach(node => {
        const nodeHistory = history.filter(h => h.nodeId === node.id);
        const avgNodeTime = nodeHistory.reduce((acc, h) => acc + (h.durationMs || 0), 0) / (nodeHistory.length || 1);

        if (avgNodeTime > 10000 && avgNodeTime > avgTotalTime * 0.5) {
            suggestions.push({
                id: `opt_perf_${node.id}`,
                type: 'performance',
                title: `Slow Node: ${node.data.label}`,
                description: `${node.data.label} takes ${Math.round(avgNodeTime / 1000)}s on average. Consider optimizing the internal logic or adding caching.`,
                impact: 'medium',
                targetNodeIds: [node.id]
            });
        }

        // 3. Reliability Heuristic
        const failures = nodeHistory.filter(h => h.status === 'error').length;
        const failureRate = failures / (nodeHistory.length || 1);
        if (failureRate > 0.3) {
            suggestions.push({
                id: `opt_rel_${node.id}`,
                type: 'reliability',
                title: `Frequent Failure: ${node.data.label}`,
                description: `This node fails ${Math.round(failureRate * 100)}% of the time. You should add a Retry Policy or a Conditional check.`,
                impact: 'high',
                targetNodeIds: [node.id]
            });
        }
    });

    return suggestions;
}
