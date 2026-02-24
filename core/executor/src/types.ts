// ============================================================
// DevFlow Studio — Executor Types
// ============================================================

export interface ExecutionContext {
    nodeId: string;
    nodeType: string;
    projectPath?: string;
}

export interface ExecutionResult {
    nodeId: string;
    success: boolean;
    exitCode: number;
    stdout: string;
    stderr: string;
    durationMs: number;
}

export type LogEmitter = (entry: {
    nodeId: string;
    level: 'stdout' | 'stderr' | 'info' | 'error';
    message: string;
}) => void;
