// ============================================================
// DevFlow Studio — History Modal (Phase 2)
// UI for viewing and restoring flow version snapshots.
// ============================================================

import { X, RotateCcw, Trash2, History } from 'lucide-react';
import { useFlowStore } from '../store/flowStore.ts';

export function HistoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const versions = useFlowStore(s => s.versions);
    const restoreVersion = useFlowStore(s => s.restoreVersion);
    const deleteVersion = useFlowStore(s => s.deleteVersion);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-canvas-elevated border border-canvas-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-canvas-border flex items-center justify-between bg-canvas-surface/50">
                    <div className="flex items-center gap-2 text-blue-400 font-bold">
                        <History size={18} />
                        <span>Version History</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-canvas-surface text-gray-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                    {versions.length === 0 ? (
                        <div className="py-12 text-center text-gray-600 italic">
                            No versions saved yet. Autosave will create snapshots as you build.
                        </div>
                    ) : (
                        versions.map(v => (
                            <div key={v.id} className="group p-3 rounded-xl border border-canvas-border bg-canvas-surface/30 hover:bg-canvas-surface transition-all flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-gray-200 truncate">{v.label}</div>
                                    <div className="text-[10px] text-gray-500 font-mono">
                                        {new Date(v.createdAt).toLocaleString()}
                                    </div>
                                </div>

                                <button
                                    onClick={() => { restoreVersion(v.id); onClose(); }}
                                    title="Restore this version"
                                    className="p-2 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <RotateCcw size={14} />
                                </button>

                                <button
                                    onClick={() => deleteVersion(v.id)}
                                    title="Delete version"
                                    className="p-2 rounded-lg bg-red-600/10 text-red-500/70 hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-canvas-surface/50 border-t border-canvas-border text-[10px] text-gray-500 text-center">
                    Last 50 versions are stored locally. Restoring will replace the current canvas.
                </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
