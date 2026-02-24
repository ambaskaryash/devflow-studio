// ============================================================
// DevFlow Studio — Docker Build Handler
// Translates dockerBuild node config → docker build command
// ============================================================

import type { DockerBuildConfig } from '@devflow/flow-engine';

export function buildDockerBuildCommand(config: DockerBuildConfig): string {
    const parts: string[] = ['docker', 'build'];

    // Build args
    if (config.buildArgs) {
        for (const [key, val] of Object.entries(config.buildArgs)) {
            parts.push('--build-arg', `${key}=${val}`);
        }
    }

    // Dockerfile path
    if (config.dockerfile) {
        parts.push('-f', config.dockerfile);
    }

    // Tag
    parts.push('-t', config.tag);

    // Context path
    parts.push(config.context);

    return parts.join(' ');
}
