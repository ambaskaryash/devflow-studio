// ============================================================
// DevFlow Studio — Flow Engine Types
// ============================================================

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped';

export type NodeType =
    | 'dockerBuild'
    | 'dockerRun'
    | 'gitPull'
    | 'scriptRun';

// Per-node config shapes
export interface DockerBuildConfig {
    context: string;
    tag: string;
    dockerfile?: string;
    buildArgs?: Record<string, string>;
}

export interface DockerRunConfig {
    image: string;
    ports?: string[];
    env?: Record<string, string>;
    detach?: boolean;
    name?: string;
    remove?: boolean;
}

export interface GitPullConfig {
    remote?: string;
    branch?: string;
    directory?: string;
}

export interface ScriptRunConfig {
    command: string;
    workingDir?: string;
    shell?: 'bash' | 'sh' | 'zsh' | 'powershell' | 'auto';
    env?: Record<string, string>;
}

export type NodeConfig =
    | DockerBuildConfig
    | DockerRunConfig
    | GitPullConfig
    | ScriptRunConfig;

// The canonical FlowNode (extends React Flow node data pattern)
export interface FlowNode {
    id: string;
    type: NodeType;
    label: string;
    config: NodeConfig;
    status: NodeStatus;
    position: { x: number; y: number };
}

// A directed edge from source node to target node
export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    /** Optional label for display */
    label?: string;
}

// A full workflow definition
export interface FlowDefinition {
    id: string;
    name: string;
    description?: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
    createdAt: string;
    updatedAt: string;
}

// Execution plan: groups of nodes that can run in parallel
export type ExecutionBatch = string[]; // node ids
export type ExecutionPlan = ExecutionBatch[];

// Validation result
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

// Execution log entry
export interface LogEntry {
    nodeId: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'stdout' | 'stderr';
    message: string;
}
