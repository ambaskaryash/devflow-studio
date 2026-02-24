// ============================================================
// DevFlow Studio — Analytics Tracker (Phase 3)
// Calculates performance trends and resource optimization tips.
// ============================================================

export interface NodeAnalytics {
    nodeId: string;
    avgDurationMs: number;
    maxCpu: number;
    maxMemory: number;
    successRate: number;
    failureCount: number;
}

export function calculateFlowAnalytics(timeline: any[]): NodeAnalytics[] {
    const stats: Record<string, { durations: number[]; cpus: number[]; mems: number[]; successes: number; total: number }> = {};

    for (const record of timeline) {
        if (!stats[record.nodeId]) {
            stats[record.nodeId] = { durations: [], cpus: [], mems: [], successes: 0, total: 0 };
        }

        const s = stats[record.nodeId];
        s.total++;
        if (record.status === 'success') s.successes++;
        if (record.durationMs) s.durations.push(record.durationMs);
        if (record.maxCpu) s.cpus.push(record.maxCpu);
        if (record.maxMemory) s.mems.push(record.maxMemory);
    }

    return Object.entries(stats).map(([nodeId, data]) => ({
        nodeId,
        avgDurationMs: data.durations.length ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length : 0,
        maxCpu: data.cpus.length ? Math.max(...data.cpus) : 0,
        maxMemory: data.mems.length ? Math.max(...data.mems) : 0,
        successRate: (data.successes / data.total) * 100,
        failureCount: data.total - data.successes,
    }));
}

export function getOptimizationTips(analytics: NodeAnalytics[]): string[] {
    const tips: string[] = [];

    for (const node of analytics) {
        if (node.maxCpu > 80) {
            tips.push(`Node ${node.nodeId} is CPU intensive (${node.maxCpu.toFixed(1)}%). Consider parallelizing or optimizing the command.`);
        }
        if (node.successRate < 50 && node.failureCount > 2) {
            tips.push(`Node ${node.nodeId} has a high failure rate. Check its configuration or dependencies.`);
        }
    }

    return tips;
}
