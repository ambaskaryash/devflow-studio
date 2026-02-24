// ============================================================
// DevFlow Studio — Docker Run Handler
// Translates dockerRun node config → docker run command
// ============================================================

import type { DockerRunConfig } from '@devflow/flow-engine';

export function buildDockerRunCommand(config: DockerRunConfig): string {
    const parts: string[] = ['docker', 'run'];

    if (config.detach) parts.push('-d');
    if (config.remove) parts.push('--rm');
    if (config.name) parts.push('--name', config.name);

    // Port mappings
    if (config.ports) {
        for (const port of config.ports) {
            parts.push('-p', port);
        }
    }

    // Environment variables
    if (config.env) {
        for (const [key, val] of Object.entries(config.env)) {
            parts.push('-e', `${key}=${val}`);
        }
    }

    // Image
    parts.push(config.image);

    return parts.join(' ');
}
