// ============================================================
// DevFlow Studio — Log Stream Panel
// ============================================================

import { useEffect, useRef } from 'react';
import { useFlowStore } from '../store/flowStore.ts';
import { Trash2 } from 'lucide-react';

const LEVEL_STYLES: Record<string, string> = {
    stdout: 'text-gray-300',
    stderr: 'text-amber-400',
    info: 'text-blue-400',
    error: 'text-red-400',
    warn: 'text-yellow-400',
};

const LEVEL_PREFIX: Record<string, string> = {
    stdout: '  ',
    stderr: 'WARN ',
    info: 'INFO ',
    error: 'ERR  ',
    warn: 'WARN ',
};

export function LogStream() {
    const { logs, clearLogs, isRunning } = useFlowStore();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs.length]);

    return (
        <div className="h-48 flex flex-col border-t border-canvas-border bg-canvas-bg flex-shrink-0">
            {/* Log header */}
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-canvas-border bg-canvas-surface">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Execution Logs</span>
                    {isRunning && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Live
                        </span>
                    )}
                    {logs.length > 0 && (
                        <span className="text-xs text-gray-600">{logs.length} lines</span>
                    )}
                </div>
                <button
                    onClick={clearLogs}
                    className="text-gray-600 hover:text-gray-400 transition-colors p-1 rounded"
                    title="Clear logs"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {/* Log content */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs custom-scrollbar">
                {logs.length === 0 ? (
                    <p className="text-gray-700 italic text-center py-8">No logs yet. Run the flow to see output here.</p>
                ) : (
                    <>
                        {logs.length > 200 && (
                            <div className="text-[10px] text-gray-600 text-center mb-4 border-b border-white/5 pb-2">
                                — Showing last 200 entries of {logs.length} —
                            </div>
                        )}
                        {logs.slice(-200).map(entry => (
                            <div key={entry.id} className="flex items-start gap-2 mb-0.5 leading-5 group hover:bg-white/5 rounded px-1 transition-colors">
                                <span className="text-gray-700 flex-shrink-0 tabular-nums opacity-60">
                                    {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                                </span>
                                <span className={`flex-shrink-0 ${LEVEL_STYLES[entry.level]} font-bold text-[10px]`}>
                                    {LEVEL_PREFIX[entry.level]}
                                </span>
                                <span className="text-blue-500/50 flex-shrink-0 truncate max-w-[80px] font-bold">
                                    {entry.nodeLabel}
                                </span>
                                <span className={`${LEVEL_STYLES[entry.level]} break-all`}>{entry.message}</span>
                            </div>
                        ))}
                    </>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
