// ============================================================
// DevFlow Studio — Analytics Panel (Phase 3)
// Visual insight into flow performance and reliability.
// ============================================================

import { useFlowStore } from '../store/flowStore.ts';
import { calculateFlowAnalytics, getOptimizationTips } from '../../../../core/analytics/src/tracker.ts';
import { BarChart3, TrendingUp, AlertTriangle, Lightbulb, Activity } from 'lucide-react';

export function AnalyticsPanel() {
    const timeline = useFlowStore(s => s.executionTimeline);
    const analytics = calculateFlowAnalytics(timeline);
    const tips = getOptimizationTips(analytics);

    if (timeline.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 italic p-6 text-center">
                <BarChart3 size={32} className="mb-4 opacity-20" />
                <p>Run your flow to see performance analytics.</p>
            </div>
        );
    }

    const avgSuccess = analytics.reduce((acc, n) => acc + n.successRate, 0) / analytics.length;

    return (
        <div className="flex flex-col h-full bg-canvas-surface animate-slide-in-right border-l border-canvas-border shadow-2xl overflow-y-auto w-[400px]">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-canvas-border bg-canvas-elevated/50">
                <TrendingUp className="text-blue-400" size={20} />
                <h2 className="text-lg font-bold text-white tracking-tight">System Insights</h2>
            </div>

            <div className="p-6 space-y-8">
                {/* Scorecards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-canvas-elevated p-4 rounded-xl border border-canvas-border group hover:border-blue-500/30 transition-all">
                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Activity size={12} className="text-blue-500" />
                            Reliability
                        </div>
                        <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                            {avgSuccess.toFixed(0)}%
                        </div>
                    </div>
                    <div className="bg-canvas-elevated p-4 rounded-xl border border-canvas-border group hover:border-emerald-500/30 transition-all">
                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                            <BarChart3 size={12} className="text-emerald-500" />
                            Avg. Latency
                        </div>
                        <div className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {(analytics.reduce((acc, n) => acc + n.avgDurationMs, 0) / 1000).toFixed(1)}s
                        </div>
                    </div>
                </div>

                {/* Resource Usage Graph */}
                <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={14} className="opacity-50" />
                        Resource Usage Profile
                    </h3>
                    <div className="bg-canvas-elevated/30 p-4 rounded-xl border border-canvas-border/50 h-32 flex items-end gap-1">
                        {timeline.slice(-30).map((r, i) => {
                            const cpuH = Math.min(100, Math.max(2, r.maxCpu ?? 0));
                            const memH = Math.min(100, Math.max(2, ((r.maxMemory ?? 0) / 1024) * 100)); // rough scaling
                            return (
                                <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 group relative" title={`Node: ${r.nodeLabel}\nCPU: ${(r.maxCpu || 0).toFixed(1)}%\nMem: ${(r.maxMemory || 0).toFixed(1)}MB`}>
                                    <div className="w-full bg-blue-500/50 rounded-t-sm transition-all group-hover:bg-blue-400" style={{ height: `${cpuH}%` }} />
                                    <div className="w-full bg-purple-500/50 rounded-b-sm transition-all group-hover:bg-purple-400" style={{ height: `${memH}%` }} />
                                </div>
                            );
                        })}
                        {timeline.length === 0 && <div className="text-xs text-gray-500 w-full text-center pb-8 flex-col items-center">No timeline data</div>}
                    </div>
                    <div className="flex justify-between items-center mt-2 px-1 text-[9px] text-gray-500 font-mono">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500/50 rounded-sm" /> CPU %</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500/50 rounded-sm" /> Memory MB</div>
                    </div>
                </section>

                {/* Performance Table */}
                <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={14} className="opacity-50" />
                        Node performance
                    </h3>
                    <div className="space-y-3">
                        {analytics.map(node => (
                            <div key={node.nodeId} className={`bg-canvas-elevated/30 p-3 rounded-lg border transition-all ${node.isBottleneck ? 'border-amber-500/50 bg-amber-500/5' : 'border-canvas-border/50 hover:bg-canvas-elevated/60'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-300">#{node.nodeId.slice(0, 8)}</span>
                                        {node.isBottleneck && <span className="text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/30">BOTTLENECK</span>}
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${node.successRate > 90 ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                        {node.successRate.toFixed(0)}% Success
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className={`italic ${node.isBottleneck ? 'text-amber-400/80 font-bold' : 'text-gray-500'}`}>Avg: {(node.avgDurationMs / 1000).toFixed(1)}s (p95: {(node.p95DurationMs / 1000).toFixed(1)}s)</div>
                                    <div className="text-blue-400/80">Peak: {node.maxCpu.toFixed(1)}% CPU | {node.maxMemory.toFixed(0)}MB</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Optimization Tips */}
                {tips.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Lightbulb size={14} className="text-amber-500" />
                            Optimization Tips
                        </h3>
                        <div className="space-y-3">
                            {tips.map((tip, i) => (
                                <div key={i} className="flex gap-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 text-xs text-amber-200/80 leading-relaxed italic">
                                    <AlertTriangle size={14} className="flex-shrink-0 text-amber-500" />
                                    <span>{tip}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
