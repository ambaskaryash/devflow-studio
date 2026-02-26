// ============================================================
// DevFlow Studio — Log Stream Panel
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useFlowStore } from '../store/flowStore.ts';
import { Trash2, Download, Search, ShieldCheck } from 'lucide-react';

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

    const [filterLevel, setFilterLevel] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs.length]);

    const filteredLogs = logs.filter(entry => {
        if (filterLevel !== 'all' && entry.level !== filterLevel) return false;
        if (searchQuery && !entry.nodeLabel.toLowerCase().includes(searchQuery.toLowerCase()) && !entry.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `devflow-logs-${new Date().toISOString().slice(0, 10)}.json`);
        dlAnchorElem.click();
    };

    return (
        <div className="h-48 flex flex-col border-t border-canvas-border bg-canvas-bg flex-shrink-0">
            {/* Log header */}
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-canvas-border bg-canvas-surface flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Execution Logs</span>
                    {isRunning && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Live
                        </span>
                    )}
                    {logs.length > 0 && (
                        <span className="text-xs text-gray-600 font-mono">{filteredLogs.length} / {logs.length}</span>
                    )}
                    <span className="text-[9px] flex items-center gap-1 bg-green-950/40 text-green-500/80 px-1.5 py-0.5 rounded border border-green-900/30" title="Logs are retained in SQLite for 30 days">
                        <ShieldCheck size={10} /> 30d Retention
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={12} className="absolute left-2 top-1.5 text-gray-500" />
                        <input type="text" placeholder="Filter..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="text-xs bg-canvas-bg border border-canvas-border rounded pl-6 pr-2 py-1 text-white focus:outline-none focus:border-blue-500 w-32" />
                    </div>

                    <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                        className="text-xs bg-canvas-bg border border-canvas-border rounded px-2 py-1 text-white focus:outline-none">
                        <option value="all">All Levels</option>
                        <option value="info">Info</option>
                        <option value="stdout">Stdout</option>
                        <option value="stderr">Stderr</option>
                        <option value="warn">Warnings</option>
                        <option value="error">Errors</option>
                    </select>

                    <button onClick={handleExport} disabled={logs.length === 0} className="text-gray-400 hover:text-white transition-colors p-1 rounded disabled:opacity-30" title="Export as JSON">
                        <Download size={13} />
                    </button>

                    <div className="w-px h-4 bg-white/10 mx-1" />

                    <button onClick={clearLogs} className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded" title="Clear logs">
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Log content */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs custom-scrollbar">
                {filteredLogs.length === 0 ? (
                    <p className="text-gray-700 italic text-center py-8">
                        {logs.length > 0 ? "No logs match the current filters." : "No logs yet. Run the flow to see output here."}
                    </p>
                ) : (
                    <>
                        {filteredLogs.length > 300 && (
                            <div className="text-[10px] text-gray-600 text-center mb-4 border-b border-white/5 pb-2">
                                — Showing last 300 entries of {filteredLogs.length} —
                            </div>
                        )}
                        {filteredLogs.slice(-300).map(entry => (
                            <div key={entry.id} className="flex items-start gap-2 mb-0.5 leading-5 group hover:bg-white/5 rounded px-1 transition-colors">
                                <span className="text-gray-700 flex-shrink-0 tabular-nums opacity-60">
                                    {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                                </span>
                                <span className={`flex-shrink-0 ${LEVEL_STYLES[entry.level]} font-bold text-[10px]`}>
                                    {LEVEL_PREFIX[entry.level]}
                                </span>
                                <span className="text-blue-500/50 flex-shrink-0 truncate max-w-[100px] font-bold" title={entry.nodeLabel}>
                                    {entry.nodeLabel}
                                </span>
                                <span className={`${LEVEL_STYLES[entry.level]} break-all selection:bg-blue-500/30`}>{entry.message}</span>
                            </div>
                        ))}
                    </>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
