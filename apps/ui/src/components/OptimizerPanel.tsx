// ============================================================
// DevFlow Studio — Smart Optimizer Panel (Phase 4)
// Drawer for actionable optimization suggestions.
// ============================================================

import { useFlowStore } from '../store/flowStore.ts';
import { Sparkles, X, Zap, AlertCircle, ArrowUpRight, RefreshCw, Layers } from 'lucide-react';
import { useEffect } from 'react';

export function OptimizerPanel() {
    const {
        showOptimizer, toggleOptimizer, optimizationSuggestions, refreshSuggestions,
        nodes, edges, executionTimeline
    } = useFlowStore();

    useEffect(() => {
        if (showOptimizer) {
            refreshSuggestions();
        }
    }, [showOptimizer, nodes.length, edges.length, executionTimeline.length]);

    if (!showOptimizer) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-canvas-elevated border-l border-white/10 shadow-2xl z-[150] flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Smart Optimizer</h2>
                        <p className="text-[10px] text-gray-500">Local Workflow Intelligence</p>
                    </div>
                </div>
                <button
                    onClick={toggleOptimizer}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {optimizationSuggestions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <div className="p-4 bg-white/5 rounded-full">
                            <Zap size={32} className="text-gray-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-300">No optimizations found</p>
                            <p className="text-xs text-gray-500">Keep building your flow to see suggestions.</p>
                        </div>
                    </div>
                ) : (
                    optimizationSuggestions.map((opt) => (
                        <div
                            key={opt.id}
                            className={`group relative p-4 rounded-xl border transition-all hover:bg-white/5 ${opt.impact === 'high' ? 'border-red-500/20 bg-red-500/5' :
                                opt.impact === 'medium' ? 'border-amber-500/20 bg-amber-500/5' :
                                    'border-blue-500/20 bg-blue-500/5'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 p-1.5 rounded-lg ${opt.type === 'parallel' ? 'bg-indigo-500/20 text-indigo-400' :
                                    opt.type === 'performance' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                    {opt.type === 'parallel' ? <Layers size={14} /> :
                                        opt.type === 'performance' ? <RefreshCw size={14} /> :
                                            <AlertCircle size={14} />}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                                        {opt.title}
                                    </h3>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        {opt.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${opt.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                                    opt.impact === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    {opt.impact} Impact
                                </span>
                                <button className="text-[10px] flex items-center gap-1 text-blue-400 font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                                    Apply fix <ArrowUpRight size={12} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-canvas-surface/50 border-t border-white/5">
                <button
                    onClick={refreshSuggestions}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                >
                    <RefreshCw size={14} />
                    Refresh Analysis
                </button>
            </div>
        </div>
    );
}
