// ============================================================
// DevFlow Studio — Shared types (UI-local copy)
// ============================================================

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped';
export type NodeType = 'dockerBuild' | 'dockerRun' | 'gitPull' | 'scriptRun';

export interface DockerBuildConfig { context: string; tag: string; dockerfile?: string; buildArgs?: Record<string, string>; }
export interface DockerRunConfig { image: string; ports?: string[]; env?: Record<string, string>; detach?: boolean; name?: string; remove?: boolean; }
export interface GitPullConfig { remote?: string; branch?: string; directory?: string; }
export interface ScriptRunConfig { command: string; workingDir?: string; shell?: string; env?: Record<string, string>; }
export type NodeConfig = DockerBuildConfig | DockerRunConfig | GitPullConfig | ScriptRunConfig;

export interface FlowNode {
    id: string; type: NodeType; label: string; config: NodeConfig;
    status: NodeStatus; position: { x: number; y: number };
}
export interface FlowEdge { id: string; source: string; target: string; label?: string; }
export interface FlowDefinition {
    id: string; name: string; description?: string;
    nodes: FlowNode[]; edges: FlowEdge[];
    createdAt: string; updatedAt: string;
}
