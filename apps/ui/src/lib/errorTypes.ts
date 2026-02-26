// ============================================================
// DevFlow Studio — Standardized Error & Retry Types
// Shared types used by the executor, UI hooks, and storage layer.
// ============================================================

// ── Retry strategy ────────────────────────────────────────────────────────────

/** How the executor handles a failed node. */
export type RetryStrategy = 'none' | 'manual' | 'auto' | 'exponential';

/** Per-node retry configuration stored in node.data.config.retryPolicy */
export interface RetryPolicy {
    /** Which retry mode to use. Default: 'none' */
    strategy: RetryStrategy;
    /** Maximum number of additional attempts (not counting the first run). Default: 2 */
    maxAttempts: number;
    /** Base backoff in milliseconds (used for 'exponential'). Default: 1000 */
    backoffMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
    strategy: 'none',
    maxAttempts: 2,
    backoffMs: 1000,
};

// ── Execution error ───────────────────────────────────────────────────────────

/** Standardized error produced by the execution engine. */
export interface ExecutionError {
    /** ID of the node that failed */
    nodeId: string;
    /** Human-readable label of the node */
    nodeLabel: string;
    /** Error message (stderr summary or caught exception message) */
    message: string;
    /** Shell exit code, if applicable */
    exitCode?: number;
    /** Which attempt number produced this error (1-indexed) */
    attempt: number;
    /** ISO timestamp */
    timestamp: string;
}

// ── Dry run result ─────────────────────────────────────────────────────────────

/** Result for a single node during a dry run simulation. */
export interface DryRunNodeResult {
    nodeId: string;
    nodeLabel: string;
    nodeType: string;
    /** 0-indexed execution batch (parallel nodes share the same order) */
    executionOrder: number;
    /** Generated command string that WOULD be run */
    command: string;
    /** Estimated duration in ms from historical metric averages */
    estimatedDurationMs: number;
    /** Safety issues detected (from safetyValidator) */
    warnings: Array<{ severity: 'warn' | 'danger'; message: string }>;
}

// ── Execution profile ─────────────────────────────────────────────────────────

/** Which sandbox environment to execute a node inside. */
export type ExecutionProfile = 'native' | 'docker' | 'ssh';

/** Per-node execution profile stored in node.data.config.executionProfile */
export interface NodeExecutionConfig {
    profile: ExecutionProfile;
    /** seconds — 0 = no timeout */
    timeoutSeconds: number;
    /** Docker image (only for profile='docker') */
    dockerImage?: string;
    /** CPU limit, e.g. '0.5' (only for profile='docker') */
    cpuLimit?: string;
    /** Memory limit, e.g. '512m' (only for profile='docker') */
    memLimit?: string;
    /** SSH hostname (only for profile='ssh') */
    sshHost?: string;
    /** SSH username (only for profile='ssh') */
    sshUser?: string;
}

export const DEFAULT_EXECUTION_CONFIG: NodeExecutionConfig = {
    profile: 'native',
    timeoutSeconds: 300,
};
