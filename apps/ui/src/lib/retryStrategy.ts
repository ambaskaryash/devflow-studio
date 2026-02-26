// ============================================================
// DevFlow Studio — Retry Utility
// Implements retryWithPolicy() supporting manual, auto, and
// exponential-backoff retry strategies.
// ============================================================

import type { RetryPolicy, ExecutionError } from './errorTypes.ts';

export interface RetryContext {
    nodeId: string;
    nodeLabel: string;
}

export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: ExecutionError;
    attempts: number;
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrap an async function with the given RetryPolicy.
 *
 * - `none`        → single attempt, no retry
 * - `auto`        → immediate retry up to maxAttempts times
 * - `exponential` → exponential back-off: backoffMs * 2^(attempt-1)
 * - `manual`      → returns after first failure with `waitingForManualRetry: true`;
 *                   caller must invoke `continueRetry()` from the returned handle
 *
 * @param fn        The async function to run (must throw on failure)
 * @param policy    The retry policy to apply
 * @param ctx       Node context for error construction
 * @param onAttempt Optional callback invoked before each attempt (for UI feedback)
 */
export async function retryWithPolicy<T>(
    fn: () => Promise<T>,
    policy: RetryPolicy,
    ctx: RetryContext,
    onAttempt?: (attempt: number) => void
): Promise<RetryResult<T>> {
    const maxRuns = policy.strategy === 'none' ? 1 : policy.maxAttempts + 1;
    let lastError: ExecutionError | undefined;

    for (let attempt = 1; attempt <= maxRuns; attempt++) {
        onAttempt?.(attempt);
        try {
            const data = await fn();
            return { success: true, data, attempts: attempt };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            lastError = {
                nodeId: ctx.nodeId,
                nodeLabel: ctx.nodeLabel,
                message,
                attempt,
                timestamp: new Date().toISOString(),
            };

            const isLastAttempt = attempt === maxRuns;
            if (isLastAttempt || policy.strategy === 'none') break;

            // Apply back-off before next attempt
            if (policy.strategy === 'exponential') {
                const backoff = policy.backoffMs * Math.pow(2, attempt - 1);
                await sleep(Math.min(backoff, 30_000)); // cap at 30s
            } else if (policy.strategy === 'auto') {
                // no wait between auto retries — immediate
            }
            // 'manual' is handled in useFlowExecution via waitForCondition()
        }
    }

    return { success: false, error: lastError, attempts: lastError?.attempt ?? 1 };
}

/**
 * Returns a promise that resolves when `resolver()` returns true.
 * Used by manual retry to wait for user interaction.
 */
export function waitForCondition(
    resolver: () => boolean,
    pollMs = 200,
    timeoutMs = 120_000
): Promise<boolean> {
    return new Promise(resolve => {
        const start = Date.now();
        const interval = setInterval(() => {
            if (resolver()) { clearInterval(interval); resolve(true); }
            if (Date.now() - start > timeoutMs) { clearInterval(interval); resolve(false); }
        }, pollMs);
    });
}
