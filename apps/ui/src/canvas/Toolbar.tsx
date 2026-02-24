// ============================================================
// DevFlow Studio — Toolbar (Phase 4)
// Ecosystem Layer: Debugger, Optimizer, and Flow Sharing.
// ============================================================

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { writeFile, readFile } from '@tauri-apps/plugin-fs';

import { useFlowStore, type NodeExecutionMetrics } from '../store/flowStore.ts';
import { useProjectStore } from '../store/projectStore.ts';
import { useAutosave } from '../hooks/useAutosave.ts';
import { useFlowExecution } from '../hooks/useFlowExecution.ts';
import { getAllNodeDefs } from '../lib/nodeRegistry.ts';
import { validateFlowSafety, type NodeSafetyReport } from '../lib/safetyValidator.ts';
import { HistoryModal } from '../components/HistoryModal.tsx';
import { SafetyModal } from '../components/SafetyModal.tsx';
import { toast } from 'react-hot-toast';

import {
    Play,
    StopCircle,
    FolderOpen,
    Trash2,
    Plus,
    Save,
    History,
    PlayCircle,
    BarChart3,
    Bug,
    Sparkles,
    Download,
    Upload
} from 'lucide-react';

export function Toolbar() {
    useAutosave();

    const {
        nodes, edges, addNode, resetAll, saveVersion,
        showAnalytics, toggleAnalytics,
        isDebugMode, toggleDebugMode,
        showOptimizer, toggleOptimizer,
        executionCheckpoint
    } = useFlowStore();

    const { runFlow, isRunning } = useFlowExecution();
    const { setProject } = useProjectStore();

    // Modal & Safety state
    const [isHistoryOpen, setHistoryOpen] = useState(false);
    const [safetyReports, setSafetyReports] = useState<NodeSafetyReport[]>([]);

    // ── Phase 3 & 5: Event Listeners ─────────────────────────────────────────
    useEffect(() => {
        const unlistenMetrics = listen<[string, NodeExecutionMetrics]>('execution-metrics', (event) => {
            const [nodeId, metrics] = event.payload;
            useFlowStore.getState().updateNodeMetrics(nodeId, metrics);
        });

        const unlistenLogs = listen<[string, 'stdout' | 'stderr', string]>('node-log', (event) => {
            const [nodeId, level, message] = event.payload;
            useFlowStore.getState().addNodeLogEntry(nodeId, level, message);
        });

        return () => {
            unlistenMetrics.then(f => f());
            unlistenLogs.then(f => f());
        };
    }, []);

    // ── Folder Selection ────────────────────────────────────────────────────
    const handleOpenFolder = async () => {
        toast.loading('Opening dialog...', { id: 'open-folder' });
        try {
            // Use a custom Rust command to open the folder picker, bypassing frontend ACL
            const selected = await invoke<string | null>('pick_folder');
            if (!selected) {
                toast.dismiss('open-folder');
                return;
            }

            toast.loading('Detecting project...', { id: 'open-folder' });
            const result = await invoke<any>('detect_project', { path: selected });

            toast.success(`Detected ${result.detected_type} project`, { id: 'open-folder' });

            setProject(selected, result.detected_type as any, {
                hasDocker: result.has_docker,
                hasGit: result.has_git,
                hasNodeProject: result.has_node,
                hasMakefile: result.has_makefile,
                hasRequirements: result.has_requirements,
                hasDockerCompose: result.has_docker_compose,
                packageScripts: result.package_scripts,
            });
        } catch (err) {
            console.error('Failed to open folder:', err);
            toast.error(`Error: ${err}`, { id: 'open-folder' });
        }
    };

    // ── Flow Execution ──────────────────────────────────────────────────────
    const handleRun = (resumeId?: string | null) => {
        if (nodes.length === 0) return;

        if (!resumeId) {
            const flowData = nodes.map(n => ({ id: n.id, label: n.data.label, nodeType: n.data.nodeType, config: n.data.config }));
            const reports = validateFlowSafety(flowData);
            if (reports.length > 0) {
                setSafetyReports(reports);
                return;
            }
        }
        executeFlow(resumeId);
    };

    const executeFlow = (resumeId?: string | null) => {
        setSafetyReports([]);
        runFlow(resumeId);
    };

    // ── Flow Sharing (.devflowpkg) ───────────────
    const handleExportPackage = async () => {
        try {
            const pkg = {
                version: '1.0',
                name: useFlowStore.getState().flowName,
                nodes,
                edges,
                exportedAt: new Date().toISOString()
            };
            const path = await saveDialog({
                defaultPath: `${pkg.name || 'flow'}.devflowpkg`,
                filters: [{ name: 'DevFlow Package', extensions: ['devflowpkg', 'json'] }]
            });
            if (path) {
                await writeFile(path, new TextEncoder().encode(JSON.stringify(pkg, null, 2)));
                alert('Flow exported successfully!');
            }
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const handleImportPackage = async () => {
        try {
            const path = await openDialog({
                filters: [{ name: 'DevFlow Package', extensions: ['devflowpkg', 'json'] }]
            });
            if (path && !Array.isArray(path)) {
                const content = await readFile(path);
                const pkg = JSON.parse(new TextDecoder().decode(content));
                if (!pkg.nodes || !pkg.edges) throw new Error('Invalid format');

                useFlowStore.setState({
                    nodes: pkg.nodes,
                    edges: pkg.edges,
                    flowName: pkg.name || 'Imported Flow'
                });
                alert('Flow imported successfully!');
            }
        } catch (err) {
            console.error('Import failed:', err);
        }
    };

    const handleManualSave = () => {
        saveVersion('Manual Save');
        alert('Snapshot saved to history.');
    };

    const nodeDefs = getAllNodeDefs();

    return (
        <div className="h-12 flex items-center gap-2 px-3 bg-canvas-surface border-b border-canvas-border flex-shrink-0 animate-fade-in relative z-20">
            <div className="flex items-center gap-2 mr-2">
                <span className="text-blue-400 text-lg">⚡</span>
                <span className="text-white font-bold text-sm tracking-tight hidden sm:block">DevFlow Studio</span>
            </div>

            <button
                onClick={handleOpenFolder}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:bg-canvas-elevated hover:text-white transition-all text-xs font-medium"
            >
                <FolderOpen size={14} />
                <span className="hidden md:block">Open</span>
            </button>

            <div className="w-px h-6 bg-canvas-border" />

            <div className="flex items-center gap-1">
                {nodeDefs.map(def => (
                    <button
                        key={def.type}
                        onClick={() => addNode(def.type)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 bg-canvas-elevated transition-all text-xs font-medium ${def.hoverClass}`}
                    >
                        <Plus size={10} />
                        <span>{def.icon}</span>
                        <span className="hidden lg:block">{def.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex-1" />

            <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:bg-canvas-elevated hover:text-white transition-all text-xs font-medium"
            >
                <History size={14} />
                <span className="hidden md:block">History</span>
            </button>

            <button
                onClick={handleManualSave}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:bg-canvas-elevated hover:text-white transition-all text-xs font-medium"
            >
                <Save size={14} />
                <span className="hidden md:block">Save</span>
            </button>

            {/* Phase 4: Package Sharing */}
            <div className="flex items-center gap-1">
                <button onClick={handleExportPackage} className="p-1.5 text-gray-400 hover:bg-canvas-elevated hover:text-white rounded-lg transition-all" title="Export .devflowpkg">
                    <Download size={16} />
                </button>
                <button onClick={handleImportPackage} className="p-1.5 text-gray-400 hover:bg-canvas-elevated hover:text-white rounded-lg transition-all" title="Import .devflowpkg">
                    <Upload size={16} />
                </button>
            </div>

            <div className="w-px h-6 bg-canvas-border" />

            {/* Debug Mode */}
            <button
                onClick={toggleDebugMode}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium ${isDebugMode ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:bg-canvas-elevated'}`}
            >
                <Bug size={14} />
                <span className="hidden md:block">Debug Mode</span>
            </button>

            {/* Optimizer */}
            <button
                onClick={toggleOptimizer}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium ${showOptimizer ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-canvas-elevated'}`}
            >
                <Sparkles size={14} />
                <span className="hidden md:block">Optimize</span>
            </button>

            {/* Analytics */}
            <button
                onClick={toggleAnalytics}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium ${showAnalytics ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-canvas-elevated'}`}
            >
                <BarChart3 size={14} />
                <span className="hidden md:block">Analytics</span>
            </button>

            <div className="w-px h-6 bg-canvas-border" />

            <button
                onClick={resetAll}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-red-500/70 hover:bg-red-900/20 hover:text-red-400 transition-all text-xs font-medium"
            >
                <Trash2 size={14} />
                <span className="hidden md:block">Clear</span>
            </button>

            {/* Action Buttons */}
            {!isRunning && executionCheckpoint && (
                <button
                    onClick={() => handleRun(executionCheckpoint)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-sm transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                >
                    <PlayCircle size={14} />
                    <span>Resume</span>
                </button>
            )}

            <button
                onClick={() => handleRun()}
                disabled={nodes.length === 0}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-sm transition-all ${isRunning ? 'bg-amber-600/20 text-amber-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
                {isRunning ? <><StopCircle size={14} className="animate-pulse" /> Running...</> : <><Play size={14} /> Run Flow</>}
            </button>

            <HistoryModal isOpen={isHistoryOpen} onClose={() => setHistoryOpen(false)} />
            <SafetyModal
                isOpen={safetyReports.length > 0}
                reports={safetyReports}
                onCancel={() => setSafetyReports([])}
                onConfirm={executeFlow}
            />
        </div>
    );
}
