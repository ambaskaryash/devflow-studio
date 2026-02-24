// ============================================================
// DevFlow Studio — SafeExecutor
// Robust wrapper for node execution logic.
// ============================================================

export interface SafeExecutionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}

/**
 * Executes a function safely, catching both sync and async errors.
 */
export async function safeExecute<T>(
    fn: () => Promise<T>,
    context: string = 'Execution'
): Promise<SafeExecutionResult<T>> {
    try {
        const result = await fn();
        return { success: true, data: result };
    } catch (err: any) {
        console.error(`[SafeExecutor] Error in ${context}:`, err);

        let message = 'An unexpected error occurred during execution.';
        let code = 'UNKNOWN_ERROR';

        if (err instanceof Error) {
            message = err.message;
            code = err.name;
        } else if (typeof err === 'string') {
            message = err;
        }

        return {
            success: false,
            error: message,
            code
        };
    }
}

/**
 * Specific wrapper for Plugin Handlers to ensure they don't block the engine.
 */
export async function executePluginHandler(
    handler: (config: any, context: any) => Promise<any>,
    config: any,
    context: any
): Promise<SafeExecutionResult> {
    return safeExecute(
        () => handler(config, context),
        `PluginHandler(${context.nodeId || 'unknown'})`
    );
}
