// ============================================================
// DevFlow Studio — Intelligent Suggestion Engine (Phase 2)
// Purely rule-based logic to generate nodes based on project files.
// ============================================================

export interface ScanResult {
    hasDocker: boolean;
    hasGit: boolean;
    hasNodeProject: boolean;
    hasMakefile: boolean;
    hasRequirements: boolean;
    hasDockerCompose: boolean;
    packageScripts: string[];
}

export interface SuggestedNode {
    type: string;
    label: string;
    config: Record<string, unknown>;
}

/**
 * Generates an array of suggested nodes based on detected files.
 * Ordered in a logical development pipeline.
 */
export function suggestNodes(scan: ScanResult): SuggestedNode[] {
    const suggestions: SuggestedNode[] = [];

    // 1. Source Control
    if (scan.hasGit) {
        suggestions.push({
            type: 'gitPull',
            label: 'Pull Source',
            config: { remote: 'origin', branch: 'main' },
        });
    }

    // 2. Dependencies / Build
    if (scan.hasNodeProject) {
        if (scan.packageScripts.includes('install')) {
            suggestions.push({
                type: 'scriptRun',
                label: 'npm install',
                config: { command: 'npm install', shell: 'auto' },
            });
        }
        if (scan.packageScripts.includes('build')) {
            suggestions.push({
                type: 'scriptRun',
                label: 'npm build',
                config: { command: 'npm run build', shell: 'auto' },
            });
        }
    } else if (scan.hasRequirements) {
        suggestions.push({
            type: 'scriptRun',
            label: 'pip install',
            config: { command: 'pip install -r requirements.txt', shell: 'auto' },
        });
    } else if (scan.hasMakefile) {
        suggestions.push({
            type: 'scriptRun',
            label: 'Make',
            config: { command: 'make', shell: 'auto' },
        });
    }

    // 3. Test
    if (scan.hasNodeProject && scan.packageScripts.includes('test')) {
        suggestions.push({
            type: 'scriptRun',
            label: 'npm test',
            config: { command: 'npm test', shell: 'auto' },
        });
    }

    // 4. Containerization
    if (scan.hasDockerCompose) {
        suggestions.push({
            type: 'scriptRun',
            label: 'Docker Compose Up',
            config: { command: 'docker-compose up -d', shell: 'auto' },
        });
    } else if (scan.hasDocker) {
        suggestions.push({
            type: 'dockerBuild',
            label: 'Build Image',
            config: { context: '.', tag: 'myapp:latest' },
        });
        suggestions.push({
            type: 'dockerRun',
            label: 'Run Container',
            config: { image: 'myapp:latest', detach: true, remove: true },
        });
    }

    return suggestions;
}
