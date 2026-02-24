// ============================================================
// DevFlow Studio — Git Pull Handler
// ============================================================

import type { GitPullConfig } from '@devflow/flow-engine';

export function buildGitPullCommand(config: GitPullConfig): string {
    const parts: string[] = ['git'];

    if (config.directory) {
        parts.push('-C', config.directory);
    }

    parts.push('pull');

    if (config.remote) parts.push(config.remote);
    if (config.branch) parts.push(config.branch);

    return parts.join(' ');
}
