// ============================================================
// DevFlow Studio — Safety Modal (Phase 2)
// Confirmation dialog triggered when dangerous commands are detected.
// ============================================================

import { AlertTriangle, ShieldAlert, ChevronRight } from 'lucide-react';
import type { NodeSafetyReport } from '../lib/safetyValidator.ts';

interface SafetyModalProps {
    isOpen: boolean;
    reports: NodeSafetyReport[];
    onCancel: () => void;
    onConfirm: () => void;
}

export function SafetyModal({ isOpen, reports, onCancel, onConfirm }: SafetyModalProps) {
    if (!isOpen) return null;

    const hasDanger = reports.some(r => r.issues.some(i => i.severity === 'danger'));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
            <div className="bg-canvas-elevated border border-canvas-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border-opacity-50">
                {/* Header */}
                <div className={`px-6 py-5 flex items-center gap-4 ${hasDanger ? 'bg-red-950/40 border-b border-red-900/50' : 'bg-amber-950/40 border-b border-amber-900/50'}`}>
                    <div className={`p-3 rounded-full ${hasDanger ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {hasDanger ? <ShieldAlert size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Execution Safety Warning</h2>
                        <p className={`text-xs ${hasDanger ? 'text-red-400/80' : 'text-amber-400/80'}`}>
                            {hasDanger
                                ? 'Dangerous commands detected. Executing these may damage your system.'
                                : 'Potentially unsafe commands found. Please review before proceeding.'}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[50vh] no-scrollbar">
                    {reports.map((report) => (
                        <div key={report.nodeId} className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <ChevronRight size={12} className="text-gray-600" />
                                <span>{report.nodeLabel}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-canvas-surface border border-canvas-border space-y-3">
                                <code className="block text-[10px] font-mono text-gray-500 bg-black/40 p-2 rounded border border-gray-800 break-all">
                                    {report.command}
                                </code>
                                <div className="space-y-2">
                                    {report.issues.map((issue, i) => (
                                        <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded-lg ${issue.severity === 'danger' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                                            <div className={`mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full ${issue.severity === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                            <div className="space-y-0.5">
                                                <div className="font-bold text-gray-200">Match: <code className="text-gray-400">{issue.pattern}</code></div>
                                                <div className="text-gray-500 leading-relaxed">{issue.message}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 bg-canvas-surface/50 border-t border-canvas-border flex items-center justify-end gap-3 font-semibold">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-xl text-gray-400 hover:bg-canvas-surface hover:text-white transition-all text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2 rounded-xl text-white shadow-lg transition-all text-sm ${hasDanger ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'}`}
                    >
                        I understand, run anyway
                    </button>
                </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={onCancel} />
        </div>
    );
}
