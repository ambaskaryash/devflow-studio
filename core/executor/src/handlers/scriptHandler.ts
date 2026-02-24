// ============================================================
// DevFlow Studio — Script Run Handler
// ============================================================

import type { ScriptRunConfig } from '@devflow/flow-engine';
import { detectShell } from '../shellAbstraction.js';

export interface ScriptCommandSpec {
    executable: string;
    args: string[];
    env?: Record<string, string>;
    cwd?: string;
}

export function buildScriptCommand(config: ScriptRunConfig): ScriptCommandSpec {
    const shell = detectShell(config.shell);
    return {
        executable: shell.executable,
        args: [...shell.args, config.command],
        env: config.env,
        cwd: config.workingDir,
    };
}
