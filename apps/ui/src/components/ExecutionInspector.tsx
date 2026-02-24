// ============================================================
// DevFlow Studio — Execution Inspector (Phase 3)
// Visualizes CPU, RAM, and duration for node executions.
// ============================================================

import { useFlowStore } from '../store/flowStore.ts';
import { Cpu, Database, Timer, Activity, Info } from 'lucide-react';

export function ExecutionInspector() {
    const timeline = useFlowStore(s => s.executionTimeline);
    const selectedNodeId = useFlowStore(s => s.selectedNodeId);

    // Find the execution record for the selected node (if any)
    const record = timeline.find(r => r.nodeId === selectedNodeId) || timeline[timeline.length - 1];

    if (!record) {
        return (
            <div className="w-64 border-l border-canvas-border bg-canvas-surface flex flex-col items-center justify-center p-6 text-center text-gray-600">
                <Activity size={32} className="mb-2 opacity-20" />
                <p className="text-xs">Select a node or run a flow to see metrics</p>
            </div>
        );
    }

    const isRunning = record.status === 'running';
    const cpu = isRunning ? record.metrics?.cpu : record.maxCpu;
    const mem = isRunning ? record.metrics?.memory : record.maxMemory;
    const duration = record.durationMs ? (record.durationMs / 1000).toFixed(1) + 's' : '...';

    return (
        <div className="w-64 border-l border-canvas-border bg-canvas-surface flex flex-col animate-slide-in">
            <div className="px-4 py-3 border-b border-canvas-border bg-canvas-bg/30 flex items-center gap-2">
                <Activity size={14} className="text-blue-400" />
                <span className="text-sm font-semibold text-white truncate">Inspector: {record.nodeLabel}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                {/* CPU Usage */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Cpu size={12} />
                            <span>CPU Usage</span>
                        </div>
                        <span className="font-mono text-blue-400">{cpu?.toFixed(1) ?? 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300 ease-out"
                            style={{ width: `${Math.min(100, cpu ?? 0)}%` }}
                        />
                    </div>
                </div>

                {/* Memory Usage */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Database size={12} />
                            <span>Memory (RAM)</span>
                        </div>
                        <span className="font-mono text-amber-500">{mem ?? 0} MB</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-amber-500 transition-all duration-300 ease-out"
                            style={{ width: `${Math.min(100, (mem ?? 0) / 10)}%` }} // Scaled for demo
                        />
                    </div>
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Timer size={12} />
                            <span>Duration</span>
                        </div>
                        <span className="font-mono text-emerald-400">{duration}</span>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-canvas-border opacity-50">
                    <div className="flex items-start gap-2 text-[10px] text-gray-500">
                        <Info size={12} className="mt-0.5 flex-shrink-0" />
                        <p>Metrics are captured directly from the system process while running.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
