// ============================================================
// DevFlow Studio — Flow Store (Zustand)  v2.0 (Phase 2)
// Central state for nodes, edges, execution, timeline, autosave
// ============================================================

import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import type { Node, Edge, NodeChange, EdgeChange, Connection } from 'reactflow';
import { getNodeDef } from '../lib/nodeRegistry.ts';
import { saveFlowVersion as saveVersionToDb } from '../lib/versionRepository.ts';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped';
export type DevFlowNodeType = string; // open string — registry-driven

export interface DevFlowNodeData {
    label: string;
    nodeType: DevFlowNodeType;
    status: NodeStatus;
    config: Record<string, unknown>;
}

export interface LogEntry {
    id: string;
    nodeId: string;
    nodeLabel: string;
    level: 'stdout' | 'stderr' | 'info' | 'error' | 'warn';
    message: string;
    timestamp: string;
}

// ─── Execution Timeline ────────────────────────────────────────────────────
export interface NodeExecutionMetrics {
    cpu: number;
    memory: number;
}

export interface NodeExecutionRecord {
    nodeId: string;
    nodeLabel: string;
    nodeType: string;
    status: NodeStatus;
    startedAt: string | null;
    finishedAt: string | null;
    durationMs: number | null;
    metrics?: NodeExecutionMetrics;
    maxCpu?: number;
    maxMemory?: number;
}

// ─── Constants ───────────────────────────────────────
const FLOW_ID_KEY = 'devflow__flowId';

function loadFlowIdFromStorage(): string {
    const existing = localStorage.getItem(FLOW_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(FLOW_ID_KEY, id);
    return id;
}

// ─── Store Interface ───────────────────────────────────────────────────────
interface FlowStore {
    // Canvas
    nodes: Node<DevFlowNodeData>[];
    edges: Edge[];
    selectedNodeId: string | null;

    // Execution
    isRunning: boolean;
    logs: LogEntry[];

    // Timeline (Phase 2)
    executionTimeline: NodeExecutionRecord[];

    // Autosave (Phase 2)
    flowId: string;
    flowName: string;
    lastSavedAt: string | null;

    // Resilience (Phase 3)
    executionCheckpoint: string | null; // ID of the node to resume from
    showAnalytics: boolean;

    // Debugger (Phase 4)
    isDebugMode: boolean;
    isPaused: boolean;
    currentDebugNodeId: string | null;

    // Optimizer (Phase 4)
    showOptimizer: boolean;
    optimizationSuggestions: any[];

    // Actions
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    setSelectedNode: (id: string | null) => void;

    addNode: (type: DevFlowNodeType, position?: { x: number; y: number }) => void;
    updateNodeConfig: (nodeId: string, config: Partial<Record<string, unknown>>) => void;
    updateNodeStatus: (nodeId: string, status: NodeStatus) => void;
    removeNode: (nodeId: string) => void;

    setIsRunning: (running: boolean) => void;
    addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
    addNodeLogEntry: (nodeId: string, level: LogEntry['level'], message: string) => void;
    clearLogs: () => void;
    setFlow: (nodes: Node<DevFlowNodeData>[], edges: Edge[]) => void;
    resetAll: () => void;

    // Timeline actions (Phase 2)
    startNodeExecution: (nodeId: string, nodeLabel: string, nodeType: string) => void;
    updateNodeMetrics: (nodeId: string, metrics: NodeExecutionMetrics) => void;
    finishNodeExecution: (nodeId: string, status: NodeStatus, finalMetrics?: { maxCpu: number; maxMemory: number }) => void;
    clearTimeline: () => void;

    // Resilience actions (Phase 3)
    setCheckpoint: (nodeId: string | null) => void;
    toggleAnalytics: () => void;

    // Debugger actions (Phase 4)
    toggleDebugMode: () => void;
    resumeDebugStep: () => void;
    stopDebugging: () => void;

    // Optimizer actions (Phase 4)
    toggleOptimizer: () => void;
    refreshSuggestions: () => void;

    // Autosave / Version History (Phase 2)
    setFlowName: (name: string) => void;
    saveVersion: (label?: string) => Promise<void>;
    restoreSnapshot: (snapshotJson: string) => void;
    markSaved: () => void;
    getSnapshotJson: () => string;
}

let nodeCounter = 1;

export const useFlowStore = create<FlowStore>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    isRunning: false,
    logs: [],
    executionTimeline: [],
    flowId: loadFlowIdFromStorage(),
    flowName: 'My Flow',
    lastSavedAt: null,
    executionCheckpoint: null,
    showAnalytics: false,
    isDebugMode: false,
    isPaused: false,
    currentDebugNodeId: null,
    showOptimizer: false,
    optimizationSuggestions: [],

    // ── Canvas changes ──────────────────────────────────────────────────────
    onNodesChange: (changes) => set(s => ({
        nodes: applyNodeChanges(changes, s.nodes) as Node<DevFlowNodeData>[],
    })),
    onEdgesChange: (changes) => set(s => ({
        edges: applyEdgeChanges(changes, s.edges),
    })),
    onConnect: (connection) => set(s => ({
        edges: addEdge({ ...connection, animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } }, s.edges),
    })),

    setSelectedNode: (id) => set({ selectedNodeId: id }),

    // ── Add Node (registry-driven defaults) ────────────────────────────────
    addNode: (type, position) => {
        const def = getNodeDef(type);
        const label = def?.label ?? type;
        const defaultConfig = def?.defaultConfig ?? {};
        const id = `${type}-${nodeCounter++}`;
        const newNode: Node<DevFlowNodeData> = {
            id,
            type: 'devflowNode',
            position: position ?? { x: 200 + Math.random() * 200, y: 150 + Math.random() * 100 },
            data: { label, nodeType: type, status: 'idle', config: { ...defaultConfig } },
        };
        set(s => ({ nodes: [...s.nodes, newNode] }));
    },

    updateNodeConfig: (nodeId, config) => set(s => {
        const nodeIndex = s.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return {};
        const newNodes = [...s.nodes];
        newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            data: { ...newNodes[nodeIndex].data, config: { ...newNodes[nodeIndex].data.config, ...config } }
        };
        return { nodes: newNodes };
    }),

    updateNodeStatus: (nodeId, status) => set(s => {
        const nodeIndex = s.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return {};
        const newNodes = [...s.nodes];
        newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            data: { ...newNodes[nodeIndex].data, status }
        };
        return { nodes: newNodes };
    }),

    removeNode: (nodeId) => set(s => ({
        nodes: s.nodes.filter(n => n.id !== nodeId),
        edges: s.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
        selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
    })),

    setIsRunning: (isRunning) => set({ isRunning }),

    addLog: (entry) => set(s => ({
        logs: [
            ...s.logs,
            { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
        ].slice(-500),
    })),

    addNodeLogEntry: (nodeId, level, message) => {
        const s = get();
        const node = s.nodes.find(n => n.id === nodeId);
        if (!node) return;

        set(state => ({
            logs: [
                ...state.logs,
                {
                    id: crypto.randomUUID(),
                    nodeId,
                    nodeLabel: node.data.label,
                    level,
                    message,
                    timestamp: new Date().toISOString()
                }
            ].slice(-500)
        }));
    },

    clearLogs: () => set({ logs: [] }),
    setFlow: (nodes, edges) => set({ nodes, edges }),

    resetAll: () => {
        set({ nodes: [], edges: [], selectedNodeId: null, logs: [], isRunning: false, executionTimeline: [] });
        nodeCounter = 1;
    },

    // ── Timeline Actions ────────────────────────────────────────────────────
    startNodeExecution: (nodeId, nodeLabel, nodeType) => set(s => {
        const existing = s.executionTimeline.find(r => r.nodeId === nodeId);
        const record: NodeExecutionRecord = {
            nodeId, nodeLabel, nodeType,
            status: 'running',
            startedAt: new Date().toISOString(),
            finishedAt: null,
            durationMs: null,
        };
        if (existing) {
            return { executionTimeline: s.executionTimeline.map(r => r.nodeId === nodeId ? record : r) };
        }
        return { executionTimeline: [...s.executionTimeline, record] };
    }),

    updateNodeMetrics: (nodeId, metrics) => set(s => ({
        executionTimeline: s.executionTimeline.map(r =>
            r.nodeId === nodeId ? { ...r, metrics } : r
        ),
    })),

    finishNodeExecution: (nodeId, status, finalMetrics) => set(s => ({
        executionTimeline: s.executionTimeline.map(r => {
            if (r.nodeId !== nodeId) return r;
            const finishedAt = new Date().toISOString();
            const durationMs = r.startedAt
                ? new Date(finishedAt).getTime() - new Date(r.startedAt).getTime()
                : null;
            return {
                ...r,
                status,
                finishedAt,
                durationMs,
                maxCpu: finalMetrics?.maxCpu ?? r.maxCpu,
                maxMemory: finalMetrics?.maxMemory ?? r.maxMemory,
                metrics: undefined // Clear live metrics on finish
            };
        }),
    })),

    clearTimeline: () => set({ executionTimeline: [] }),

    setCheckpoint: (nodeId) => set({ executionCheckpoint: nodeId }),
    toggleAnalytics: () => set(s => ({ showAnalytics: !s.showAnalytics })),

    // ── Debugger Actions ────────────────────────────────────────────────────
    toggleDebugMode: () => set(s => ({ isDebugMode: !s.isDebugMode, isPaused: false, currentDebugNodeId: null })),
    resumeDebugStep: () => set({ isPaused: false }),
    stopDebugging: () => set({ isDebugMode: false, isPaused: false, currentDebugNodeId: null }),

    // ── Optimizer Actions ───────────────────────────────────────────────────
    toggleOptimizer: () => set(s => {
        const show = !s.showOptimizer;
        if (show) {
            // Basic trigger - in real app would call analyzer
            return { showOptimizer: true };
        }
        return { showOptimizer: false };
    }),
    refreshSuggestions: () => {
        const s = get();
        import('../../../../core/optimizer/src/engine.ts').then(m => {
            const suggestions = m.analyzeFlow(s.nodes, s.edges, s.executionTimeline);
            set({ optimizationSuggestions: suggestions });
        });
    },

    // ── Autosave / Version History ──────────────────────────────────────────
    setFlowName: (name) => set({ flowName: name }),

    getSnapshotJson: () => {
        const { nodes, edges, flowName } = get();
        return JSON.stringify({ flowName, nodes, edges, exportedAt: new Date().toISOString() }, null, 2);
    },

    saveVersion: async (label) => {
        const { flowId, getSnapshotJson, nodes } = get();
        const snapshotJson = getSnapshotJson();
        const commitMessage = label ?? `Snapshot ${new Date().toLocaleTimeString()}`;

        try {
            await saveVersionToDb({
                flowId,
                snapshotJson,
                commitMessage,
                nodeCount: nodes.length
            });
            set({ lastSavedAt: new Date().toISOString() });
        } catch (err) {
            console.error("Failed to save version to DB:", err);
        }
    },

    markSaved: () => set({ lastSavedAt: new Date().toISOString() }),

    restoreSnapshot: (snapshotJson: string) => {
        try {
            const parsed = JSON.parse(snapshotJson) as { nodes: Node<DevFlowNodeData>[]; edges: Edge[]; flowName?: string };
            set({
                nodes: parsed.nodes ?? [],
                edges: parsed.edges ?? [],
                flowName: parsed.flowName ?? 'Restored Flow',
                selectedNodeId: null,
                executionTimeline: [],
            });
        } catch { /* ignore bad snapshots */ }
    }
}));
