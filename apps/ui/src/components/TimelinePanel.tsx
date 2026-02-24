// ============================================================
// DevFlow Studio — Timeline Panel (Phase 2)
// Horizontal animated visualization of node execution order.
// ============================================================

import { useFlowStore, type NodeExecutionRecord } from '../store/flowStore.ts';
import { getNodeDef } from '../lib/nodeRegistry.ts';
import { useFlowExecution } from '../hooks/useFlowExecution.ts';
import { Clock, CheckCircle2, XCircle, PlayCircle, MinusCircle, RotateCcw } from 'lucide-react';

function TimelinePill({ record }: { record: NodeExecutionRecord }) {
    const def = getNodeDef(record.nodeType);
    const icon = def?.icon ?? '🔌';

    const statusMap = {
        idle: { icon: <MinusCircle size={12} />, cls: 'bg-gray-800 text-gray-500 border-gray-700' },
        running: { icon: <PlayCircle size={12} className="animate-pulse" />, cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
        success: { icon: <CheckCircle2 size={12} />, cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
        error: { icon: <XCircle size={12} />, cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
        skipped: { icon: <MinusCircle size={12} />, cls: 'bg-gray-800 text-gray-600 border-gray-700' },
    };

    const s = statusMap[record.status] || statusMap.idle;
    const duration = record.durationMs ? `${(record.durationMs / 1000).toFixed(1)}s` : '';

    const { runFlow, isRunning } = useFlowExecution();
    const updateNodeStatus = useFlowStore(s => s.updateNodeStatus);

    const handleRetry = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isRunning) return;
        updateNodeStatus(record.nodeId, 'idle');
        runFlow(record.nodeId);
    };

    return (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all group ${s.cls}`}
            title={`${record.nodeLabel} (${record.status}) ${duration ? `— ${duration}` : ''}`}
        >
            <span>{icon}</span>
            <span className="truncate max-w-[100px]">{record.nodeLabel}</span>
            <span className="opacity-70">{s.icon}</span>
            {duration && <span className="text-[10px] opacity-60 ml-0.5">{duration}</span>}

            {record.status === 'error' && !isRunning && (
                <button
                    onClick={handleRetry}
                    className="ml-1 p-0.5 rounded-full hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Retry this node"
                >
                    <RotateCcw size={10} />
                </button>
            )}
        </div>
    );
}

export function TimelinePanel() {
    const timeline = useFlowStore(s => s.executionTimeline);
    const clearTimeline = useFlowStore(s => s.clearTimeline);

    if (timeline.length === 0) {
        return (
            <div className="h-10 flex items-center px-4 bg-canvas-surface/30 border-t border-canvas-border text-[10px] text-gray-600 italic">
                <Clock size={10} className="mr-2 opacity-50" />
                Execution timeline will appear here when you run a flow...
            </div>
        );
    }

    return (
        <div className="h-12 flex items-center gap-3 px-4 bg-canvas-surface border-t border-canvas-border overflow-hidden">
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-r border-canvas-border pr-3 h-full">
                <Clock size={12} />
                <span className="hidden sm:inline">Timeline</span>
            </div>

            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {timeline.map((record, i) => (
                    <div key={record.nodeId} className="flex items-center gap-2">
                        <TimelinePill record={record} />
                        {i < timeline.length - 1 && (
                            <div className="w-4 h-px bg-canvas-border" />
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={clearTimeline}
                className="text-[10px] font-bold text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-widest pl-3 border-l border-canvas-border h-full"
            >
                Clear
            </button>
        </div>
    );
}
