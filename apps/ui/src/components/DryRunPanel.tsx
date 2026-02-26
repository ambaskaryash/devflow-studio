import { useState, useEffect } from 'react';
import { runDryRun } from '../lib/dryRunEngine.ts';
import type { DryRunNodeResult } from '../lib/errorTypes.ts';
import { useFlowStore } from '../store/flowStore.ts';
import { AlertTriangle, ShieldCheck, Clock, X, TerminalSquare, AlertOctagon } from 'lucide-react';

interface Props {
    onClose: () => void;
}

export function DryRunPanel({ onClose }: Props) {
    const { nodes, edges } = useFlowStore();
    const [results, setResults] = useState<DryRunNodeResult[] | null>(null);
    const [isSimulating, setIsSimulating] = useState(true);

    useEffect(() => {
        setIsSimulating(true);
        runDryRun(nodes, edges).then(res => {
            setResults(res);
            setIsSimulating(false);
        });
    }, [nodes, edges]);

    const totalDuration = results?.reduce((sum, r) => sum + r.estimatedDurationMs, 0) ?? 0;
    const allWarnings = results?.flatMap(r => r.warnings) ?? [];
    const dangerCount = allWarnings.filter(w => w.severity === 'danger').length;
    const warnCount = allWarnings.filter(w => w.severity === 'warn').length;

    return (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-[#0d1117] border-l border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#161b22]">
                <div className="flex items-center gap-3">
                    <TerminalSquare size={18} className="text-blue-400" />
                    <div>
                        <h2 className="text-sm font-semibold text-white">Dry Run Simulation</h2>
                        <p className="text-[10px] text-gray-500">Pipeline preview & safety check</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-colors">
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isSimulating ? (
                    <div className="text-center py-12 text-gray-500 text-xs">Simulating execution...</div>
                ) : results?.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-xs">Graph is empty. Add nodes to simulate.</div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#161b22] border border-white/5 rounded-xl p-4">
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
                                    <Clock size={12} /> Estimated Time
                                </div>
                                <div className="text-2xl font-mono text-white">
                                    {(totalDuration / 1000).toFixed(1)}s
                                </div>
                            </div>
                            <div className={`border rounded-xl p-4 ${dangerCount > 0 ? 'bg-red-950/20 border-red-900/40 text-red-500' : warnCount > 0 ? 'bg-yellow-950/20 border-yellow-900/40 text-yellow-500' : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-500'}`}>
                                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70 mb-1 flex items-center gap-1.5">
                                    {dangerCount > 0 ? <AlertOctagon size={12} /> : warnCount > 0 ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                                    Safety Status
                                </div>
                                <div className="text-2xl font-semibold">
                                    {dangerCount > 0 ? `${dangerCount} Critical` : warnCount > 0 ? `${warnCount} Warnings` : 'All Clear'}
                                </div>
                            </div>
                        </div>

                        {/* Execution Plan Checklist */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Execution Plan</h3>
                            <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-white/10 before:-z-10">
                                {results?.map((res) => (
                                    <div key={res.nodeId} className="relative pl-8">
                                        <div className="absolute left-[8px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-[#0d1117] z-10" />

                                        <div className="bg-[#161b22] border border-white/5 rounded-lg p-3 group hover:border-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-white">{res.nodeLabel}</span>
                                                    <span className="text-[9px] font-mono text-gray-500 bg-black/30 px-1.5 py-0.5 rounded">Batch {res.executionOrder}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-mono">~{(res.estimatedDurationMs / 1000).toFixed(1)}s</span>
                                            </div>

                                            <div className="bg-black/50 rounded-md p-2 overflow-x-auto border border-black/50">
                                                <code className="text-[10px] font-mono text-gray-400 whitespace-nowrap">
                                                    $ {res.command}
                                                </code>
                                            </div>

                                            {res.warnings.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {res.warnings.map((w, idx) => (
                                                        <div key={idx} className={`text-[10px] flex items-start gap-1.5 p-1.5 rounded bg-black/20 ${w.severity === 'danger' ? 'text-red-400 border border-red-900/30' : 'text-yellow-400 border border-yellow-900/30'}`}>
                                                            {w.severity === 'danger' ? <AlertOctagon size={11} className="mt-0.5 shrink-0" /> : <AlertTriangle size={11} className="mt-0.5 shrink-0" />}
                                                            <span>{w.message}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#161b22] text-center">
                <p className="text-[10px] text-gray-500">Estimates are based on your personal execution history via metric averages.</p>
            </div>
        </div>
    );
}
