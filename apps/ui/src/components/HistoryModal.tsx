// ============================================================
// DevFlow Studio — History Modal (Phase 2)
// UI for viewing and restoring flow version snapshots.
// ============================================================

import { useState } from 'react';
import { X, History, GitCommit } from 'lucide-react';
import { FlowVersionPanel } from './FlowVersionPanel.tsx';

export function HistoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'executions' | 'versions'>('versions');

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

                {/* Tabs */}
                <div className="flex px-4 border-b border-canvas-border bg-canvas-surface/30">
                    <button
                        onClick={() => setActiveTab('versions')}
                        className={`py-2 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'versions' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        <GitCommit size={14} /> Flow Versions
                    </button>
                    <button
                        onClick={() => setActiveTab('executions')}
                        className={`py-2 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'executions' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        <History size={14} /> Execution Runs
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-2">
                    {activeTab === 'versions' ? (
                        <FlowVersionPanel />
                    ) : (
                        <div className="py-12 text-center text-gray-600 italic text-sm px-4">
                            Execution run history tracking is coming soon.
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
