// ============================================================
// DevFlow Studio — App Layout
// ============================================================

import { Toolbar } from './canvas/Toolbar.tsx';
import { FlowCanvas } from './canvas/FlowCanvas.tsx';
import { NodeSettingsPanel } from './canvas/NodeSettingsPanel.tsx';
import { TimelinePanel } from './components/TimelinePanel.tsx';
import { ExecutionInspector } from './components/ExecutionInspector.tsx';
import { LogStream } from './components/LogStream.tsx';
import { AnalyticsPanel } from './components/AnalyticsPanel.tsx';
import { FlowDebuggerPanel } from './components/FlowDebuggerPanel.tsx';
import { useFlowStore } from './store/flowStore.ts';
import { useProjectStore } from './store/projectStore.ts';
import { useEffect } from 'react';
import { initializePlugins } from './lib/pluginService.ts';
import { Info, X } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Toaster } from 'react-hot-toast';
import { metricService } from './lib/metricService.ts';
import { OptimizerPanel } from './components/OptimizerPanel.tsx';

function SuggestionBanner() {
    const { projectPath, projectType, scanResult, showSuggestionBanner, dismissSuggestion } = useProjectStore();
    const { setFlow } = useFlowStore();

    if (!showSuggestionBanner || !projectPath) return null;

    const handleApply = async () => {
        if (!scanResult) return;
        try {
            const { suggestNodes } = await import('./lib/suggestionEngine.ts');
            const suggestions = suggestNodes(scanResult);

            // Convert suggestions to React Flow Node/Edge format
            const rfNodes = suggestions.map((n, i) => ({
                id: `node-${i}`,
                type: 'devflowNode' as const,
                position: { x: 100 + i * 250, y: 150 },
                data: {
                    label: n.label,
                    nodeType: n.type,
                    status: 'idle' as const,
                    config: n.config as unknown as Record<string, unknown>
                },
            }));

            // Link them sequentially
            const rfEdges = [];
            for (let i = 0; i < rfNodes.length - 1; i++) {
                rfEdges.push({
                    id: `e-${i}-${i + 1}`,
                    source: rfNodes[i].id,
                    target: rfNodes[i + 1].id,
                    style: { stroke: '#3b82f6', strokeWidth: 2 },
                });
            }

            setFlow(rfNodes, rfEdges);
        } catch { }
        dismissSuggestion();
    };

    const typeLabel = { 'docker-only': 'Docker', 'full-stack': 'Full Stack CI', 'script-only': 'Script Pipeline', empty: '' }[projectType ?? 'empty'];

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-950/60 border-b border-blue-800/40 text-sm animate-slide-in">
            <Info size={14} className="text-blue-400 flex-shrink-0" />
            <span className="text-blue-300 flex-1">
                Detected <strong>{typeLabel}</strong> project at <code className="text-blue-200 font-mono text-xs">{projectPath}</code>
                {' '}— Apply starter flow?
            </span>
            <button
                onClick={handleApply}
                className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
                Apply Template
            </button>
            <button onClick={dismissSuggestion} className="text-blue-600 hover:text-blue-400 transition-colors">
                <X size={14} />
            </button>
        </div>
    );
}

function StatusBar() {
    const { nodes, edges, isRunning } = useFlowStore();
    const { projectPath } = useProjectStore();

    const successCount = nodes.filter(n => n.data?.status === 'success').length;
    const errorCount = nodes.filter(n => n.data?.status === 'error').length;

    return (
        <div className="h-6 flex items-center gap-4 px-4 bg-canvas-bg border-t border-canvas-border text-xs text-gray-600">
            <span>{nodes.length} nodes · {edges.length} edges</span>
            {isRunning && <span className="text-amber-500">● Running...</span>}
            {!isRunning && successCount > 0 && <span className="text-green-500">✓ {successCount} succeeded</span>}
            {!isRunning && errorCount > 0 && <span className="text-red-500">✗ {errorCount} failed</span>}
            <span className="flex-1" />
            {projectPath && (
                <span className="font-mono truncate max-w-xs" title={projectPath}>
                    📁 {projectPath.split('/').slice(-2).join('/')}
                </span>
            )}
            <span>DevFlow Studio v0.1.0</span>
        </div>
    );
}

export default function App() {
    const { selectedNodeId, showAnalytics } = useFlowStore();

    // ── Phase 5: Environment Check ──────────────────────────────────────────
    // Tauri v2 bridge detection
    const isTauri = !!(window as any).__TAURI_INTERNALS__;

    useEffect(() => {
        if (isTauri) {
            void initializePlugins();
            // Phase 5: Startup Telemetry
            const startupTime = performance.now();
            metricService.log('startup', startupTime, { version: '0.1.0' });
        }
    }, [isTauri]);

    if (!isTauri) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0d1117] text-gray-300 p-8 text-center font-sans">
                <div className="text-6xl mb-6">🛰️</div>
                <h1 className="text-2xl font-bold text-white mb-2">Tauri Context Missing</h1>
                <p className="max-w-md text-gray-400 mb-8 leading-relaxed">
                    DevFlow Studio requires the Tauri native shell to access system plugins (Dialog, Filesystem, Shell).
                    It looks like you're running in a regular browser window.
                </p>
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 text-left w-full max-w-lg shadow-2xl">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">How to fix:</p>
                    <ol className="space-y-3 text-sm list-decimal list-inside">
                        <li>Stop your current <code className="text-amber-500">npm run dev</code> command.</li>
                        <li>Run <code className="text-green-500 font-mono">npm run tauri dev</code> instead.</li>
                        <li>The native application window will open automatically with all features enabled.</li>
                    </ol>
                </div>
                <p className="mt-8 text-xs text-gray-500 font-mono">Environment: Browser / Web-only Model</p>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="flex flex-col h-screen w-screen bg-canvas-bg text-white overflow-hidden font-sans">
                <Toolbar />
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: '#161b22',
                            color: '#e6edf3',
                            border: '1px solid #30363d',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: '12px',
                        },
                    }}
                />
                <SuggestionBanner />

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Main Canvas + Timeline Area */}
                    <div className="flex-1 flex flex-col relative overflow-hidden">
                        <FlowCanvas />
                        <TimelinePanel />
                    </div>

                    {/* Right Panels container */}
                    <div className="flex items-stretch h-full border-l border-canvas-border shadow-2xl z-30">
                        {/* Analytics Slide-in */}
                        {showAnalytics && <AnalyticsPanel />}

                        {/* Node Settings & Observability */}
                        <div className="flex flex-col w-80 bg-canvas-surface shadow-inner overflow-y-auto">
                            {selectedNodeId && <NodeSettingsPanel />}
                            <div className="h-px bg-canvas-border my-2" />
                            <ExecutionInspector />
                        </div>
                        {/* Fixed position panels */}
                        <FlowDebuggerPanel />
                        <OptimizerPanel />
                    </div>
                </div>

                <LogStream />
                <StatusBar />
            </div>
        </ErrorBoundary>
    );
}
