// ============================================================
// DevFlow Studio — Flow Debugger Panel (Phase 4)
// Floating UI for step-by-step execution control.
// ============================================================

import { useFlowStore } from '../store/flowStore.ts';
import { Play, SkipForward, Square, Bug, Info } from 'lucide-react';

export function FlowDebuggerPanel() {
    const {
        isDebugMode, isPaused, currentDebugNodeId, isRunning,
        resumeDebugStep, stopDebugging, nodes
    } = useFlowStore();

    if (!isDebugMode) return null;

    const currentNode = nodes.find(n => n.id === currentDebugNodeId);

    return (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-in-top">
            <div className="bg-canvas-elevated/90 backdrop-blur-md border-2 border-amber-500/50 rounded-2xl shadow-2xl p-4 flex items-center gap-6 min-w-[400px]">
                {/* Status Indicator */}
                <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                    <div className={`p-2 rounded-lg ${isRunning ? 'bg-amber-500/20 text-amber-500 animate-pulse' : 'bg-canvas-surface text-gray-500'}`}>
                        <Bug size={18} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Debug Mode</div>
                        <div className="text-xs text-white font-medium truncate max-w-[120px]">
                            {isPaused ? 'Paused' : isRunning ? 'Running...' : 'Ready'}
                        </div>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={resumeDebugStep}
                        disabled={!isPaused}
                        title="Resume Execution (F5)"
                        className={`p-2.5 rounded-xl transition-all ${isPaused ? 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20' : 'bg-canvas-surface text-gray-600 cursor-not-allowed'}`}
                    >
                        <Play size={20} fill="currentColor" />
                    </button>

                    <button
                        onClick={resumeDebugStep}
                        disabled={!isPaused}
                        title="Step Over (F10)"
                        className={`p-2.5 rounded-xl transition-all ${isPaused ? 'bg-canvas-surface text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 hover:scale-105 active:scale-95' : 'bg-canvas-surface text-gray-600 cursor-not-allowed'}`}
                    >
                        <SkipForward size={20} />
                    </button>

                    <div className="w-px h-8 bg-white/10 mx-1" />

                    <button
                        onClick={stopDebugging}
                        title="Stop Debugger"
                        className="p-2.5 rounded-xl bg-canvas-surface text-red-400 border border-red-500/30 hover:bg-red-500/10 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Square size={20} fill="currentColor" />
                    </button>
                </div>

                {/* Context Info */}
                {isPaused && currentNode && (
                    <div className="flex items-center gap-2 pl-4 border-l border-white/10 max-w-[180px]">
                        <Info size={14} className="text-blue-400 flex-shrink-0" />
                        <div className="text-[10px] text-gray-400 truncate">
                            Stopped at: <span className="text-blue-300 font-medium">{currentNode.data.label}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Visual indicator on the bottom of the panel */}
            <div className="h-1 bg-amber-500 w-full mt-[-4px] rounded-full blur-[2px] opacity-50" />
        </div>
    );
}
