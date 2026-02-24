// ============================================================
// DevFlow Studio — Toolbar (P0/P1 Enhanced)
// Save/Load flows, Templates, Shell Export, Secrets Vault
// ============================================================

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

import { useFlowStore } from '../store/flowStore.ts';
import { useProjectStore } from '../store/projectStore.ts';
import { useAutosave } from '../hooks/useAutosave.ts';
import { useFlowExecution } from '../hooks/useFlowExecution.ts';
import { getAllNodeDefs } from '../lib/nodeRegistry.ts';
import { validateFlowSafety, type NodeSafetyReport } from '../lib/safetyValidator.ts';
import { exportAsShellScript } from '../lib/shellExporter.ts';
import { HistoryModal } from '../components/HistoryModal.tsx';
import { SafetyModal } from '../components/SafetyModal.tsx';
import { TemplateModal } from '../components/TemplateModal.tsx';
import { SecretsPanel } from '../components/SecretsPanel.tsx';
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
    Upload,
    Zap,
    KeyRound,
    FileCode,
    FolderInput,
} from 'lucide-react';

export function Toolbar() {
    useAutosave();

    const {
        nodes, edges, addNode, resetAll, saveVersion,
        flowName, setFlowName, setFlow,
        showAnalytics, toggleAnalytics,
        isDebugMode, toggleDebugMode,
        showOptimizer, toggleOptimizer,
        executionCheckpoint
    } = useFlowStore();

    const { runFlow, isRunning } = useFlowExecution();
    const { setProject, projectPath } = useProjectStore();

    const [isHistoryOpen, setHistoryOpen] = useState(false);
    const [isTemplateOpen, setTemplateOpen] = useState(false);
    const [isSecretsOpen, setSecretsOpen] = useState(false);
    const [safetyReports, setSafetyReports] = useState<NodeSafetyReport[]>([]);

    // ── Folder Selection ──────────────────────────────────────────────────────
    const handleOpenFolder = async () => {
        toast.loading('Opening dialog...', { id: 'open-folder' });
        try {
            const selected = await invoke<string | null>('pick_folder');
            if (!selected) { toast.dismiss('open-folder'); return; }

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
            toast.error(`Error: ${err}`, { id: 'open-folder' });
        }
    };

    // ── Save Flow to Disk ─────────────────────────────────────────────────────
    const handleSaveToDisk = async () => {
        toast.loading('Saving...', { id: 'save-flow' });
        try {
            const content = JSON.stringify({
                version: '2.0',
                flowName,
                nodes,
                edges,
                projectPath,
                savedAt: new Date().toISOString(),
            }, null, 2);
            const result = await invoke<string | null>('save_flow', {
                content,
                defaultName: `${flowName.replace(/\s+/g, '-') || 'flow'}.devflow.json`,
            });
            if (result) toast.success('Flow saved to disk!', { id: 'save-flow' });
            else toast.dismiss('save-flow');
        } catch (err) {
            toast.error(`Save failed: ${err}`, { id: 'save-flow' });
        }
    };

    // ── Load Flow from Disk ───────────────────────────────────────────────────
    const handleLoadFromDisk = async () => {
        toast.loading('Loading...', { id: 'load-flow' });
        try {
            const result = await invoke<[string, string] | null>('load_flow');
            if (!result) { toast.dismiss('load-flow'); return; }
            const [, content] = result;
            const data = JSON.parse(content);
            if (!data.nodes || !data.edges) throw new Error('Invalid flow file format');
            setFlow(data.nodes, data.edges);
            if (data.flowName) setFlowName(data.flowName);
            toast.success('Flow loaded!', { id: 'load-flow' });
        } catch (err) {
            toast.error(`Load failed: ${err}`, { id: 'load-flow' });
        }
    };

    // ── Export as Shell Script ────────────────────────────────────────────────
    const handleExportScript = async () => {
        toast.loading('Exporting script...', { id: 'export-script' });
        try {
            const script = exportAsShellScript(nodes, edges, flowName, projectPath ?? '.');
            const content = script;
            const defaultName = `${flowName.replace(/\s+/g, '-') || 'flow'}.sh`;
            const result = await invoke<string | null>('save_flow', {
                content,
                defaultName,
            });
            if (result) toast.success(`Script saved: ${defaultName}`, { id: 'export-script' });
            else toast.dismiss('export-script');
        } catch (err) {
            toast.error(`Export failed: ${err}`, { id: 'export-script' });
        }
    };

    // ── Flow Execution ────────────────────────────────────────────────────────
    const handleRun = (resumeId?: string | null) => {
        if (nodes.length === 0) return;
        if (!resumeId) {
            const flowData = nodes.map(n => ({ id: n.id, label: n.data.label, nodeType: n.data.nodeType, config: n.data.config }));
            const reports = validateFlowSafety(flowData);
            if (reports.length > 0) { setSafetyReports(reports); return; }
        }
        executeFlow(resumeId);
    };

    const executeFlow = (resumeId?: string | null) => {
        setSafetyReports([]);
        runFlow(resumeId);
    };

    const handleManualSave = () => {
        saveVersion('Manual Save');
        toast.success('Snapshot saved to history!');
    };

    const nodeDefs = getAllNodeDefs();

    return (
        <div className="h-12 flex items-center gap-2 px-3 bg-canvas-surface border-b border-canvas-border flex-shrink-0 animate-fade-in relative z-20">
            {/* Brand */}
            <div className="flex items-center gap-2 mr-2 flex-shrink-0">
                <span className="text-blue-400 text-lg">⚡</span>
                <span className="text-white font-bold text-sm tracking-tight hidden sm:block">DevFlow Studio</span>
            </div>

            {/* Open Project */}
            <button onClick={handleOpenFolder}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:bg-canvas-elevated hover:text-white transition-all text-xs font-medium flex-shrink-0"
                title="Open project folder">
                <FolderOpen size={14} />
                <span className="hidden md:block">Open</span>
            </button>

            <div className="w-px h-6 bg-canvas-border flex-shrink-0" />

            {/* Templates */}
            <button onClick={() => setTemplateOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-amber-400/80 hover:bg-amber-900/20 hover:text-amber-400 transition-all text-xs font-medium flex-shrink-0"
                title="Load a flow template">
                <Zap size={14} />
                <span className="hidden md:block">Templates</span>
            </button>

            <div className="w-px h-6 bg-canvas-border flex-shrink-0" />

            {/* Node type buttons — scrollable */}
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar min-w-0">
                {nodeDefs.map(def => (
                    <button
                        key={def.type}
                        onClick={() => addNode(def.type)}
                        title={`Add ${def.label}`}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-400 bg-canvas-elevated transition-all text-xs font-medium flex-shrink-0 ${def.hoverClass}`}
                    >
                        <Plus size={9} />
                        <span>{def.icon}</span>
                        <span className="hidden xl:block">{def.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex-1" />

            {/* History / Save */}
            <button onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:bg-canvas-elevated hover:text-white transition-all text-xs font-medium flex-shrink-0"
                title="Version history">
                <History size={14} />
                <span className="hidden md:block">History</span>
            </button>

            <button onClick={handleManualSave}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:bg-canvas-elevated hover:text-white transition-all text-xs font-medium flex-shrink-0"
                title="Save snapshot">
                <Save size={14} />
            </button>

            <div className="w-px h-6 bg-canvas-border flex-shrink-0" />

            {/* Save/Load to disk + Export script */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={handleSaveToDisk} title="Save flow to disk (.devflow.json)"
                    className="p-1.5 text-green-400/70 hover:bg-green-900/20 hover:text-green-400 rounded-lg transition-all">
                    <FolderInput size={15} />
                </button>
                <button onClick={handleLoadFromDisk} title="Load flow from disk"
                    className="p-1.5 text-blue-400/70 hover:bg-blue-900/20 hover:text-blue-400 rounded-lg transition-all">
                    <Upload size={15} />
                </button>
                <button onClick={handleExportScript} title="Export flow as shell script (.sh)"
                    className="p-1.5 text-purple-400/70 hover:bg-purple-900/20 hover:text-purple-400 rounded-lg transition-all">
                    <FileCode size={15} />
                </button>
                <button onClick={() => setSecretsOpen(true)} title="Secrets vault"
                    className="p-1.5 text-yellow-400/70 hover:bg-yellow-900/20 hover:text-yellow-400 rounded-lg transition-all">
                    <KeyRound size={15} />
                </button>
            </div>

            <div className="w-px h-6 bg-canvas-border flex-shrink-0" />

            {/* Debug / Optimizer / Analytics */}
            <button onClick={toggleDebugMode}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium flex-shrink-0 ${isDebugMode ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:bg-canvas-elevated'}`}>
                <Bug size={14} />
                <span className="hidden md:block">Debug</span>
            </button>

            <button onClick={toggleOptimizer}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all text-xs font-medium flex-shrink-0 ${showOptimizer ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-canvas-elevated'}`}>
                <Sparkles size={14} />
            </button>

            <button onClick={toggleAnalytics}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all text-xs font-medium flex-shrink-0 ${showAnalytics ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-canvas-elevated'}`}>
                <BarChart3 size={14} />
            </button>

            <div className="w-px h-6 bg-canvas-border flex-shrink-0" />

            <button onClick={resetAll}
                className="p-1.5 text-red-500/60 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-all flex-shrink-0" title="Clear canvas">
                <Trash2 size={14} />
            </button>

            {/* Resume Flow */}
            {!isRunning && executionCheckpoint && (
                <button onClick={() => handleRun(executionCheckpoint)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-sm transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 flex-shrink-0">
                    <PlayCircle size={14} />
                    <span>Resume</span>
                </button>
            )}

            {/* Run Flow */}
            <button onClick={() => handleRun()} disabled={nodes.length === 0}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-sm transition-all flex-shrink-0 ${isRunning ? 'bg-amber-600/20 text-amber-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                {isRunning ? <><StopCircle size={14} className="animate-pulse" /> Running...</> : <><Play size={14} /> Run Flow</>}
            </button>

            {/* Modals */}
            <HistoryModal isOpen={isHistoryOpen} onClose={() => setHistoryOpen(false)} />
            <SafetyModal
                isOpen={safetyReports.length > 0}
                reports={safetyReports}
                onCancel={() => setSafetyReports([])}
                onConfirm={executeFlow}
            />
            {isTemplateOpen && <TemplateModal onClose={() => setTemplateOpen(false)} />}
            {isSecretsOpen && <SecretsPanel onClose={() => setSecretsOpen(false)} />}
        </div>
    );
}
