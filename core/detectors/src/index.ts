// ============================================================
// DevFlow Studio — Project Detector
// Scans directory for Dockerfile, .git, package.json etc.
// ============================================================

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FlowDefinition } from '@devflow/flow-engine';
import {
    dockerOnlyTemplate,
    scriptOnlyTemplate,
    fullStackTemplate,
} from './templates.js';

export interface DetectionResult {
    hasDocker: boolean;
    hasGit: boolean;
    hasNodeProject: boolean;
    detectedType: 'docker-only' | 'script-only' | 'full-stack' | 'empty';
    suggestedFlow: FlowDefinition | null;
    detectedFiles: string[];
}

export function detectProject(folderPath: string): DetectionResult {
    const detected: string[] = [];

    const hasDocker =
        existsSync(join(folderPath, 'Dockerfile')) ||
        existsSync(join(folderPath, 'docker-compose.yml')) ||
        existsSync(join(folderPath, 'docker-compose.yaml'));

    const hasGit = existsSync(join(folderPath, '.git'));

    const hasNodeProject =
        existsSync(join(folderPath, 'package.json'));

    if (hasDocker) detected.push('Dockerfile');
    if (hasGit) detected.push('.git');
    if (hasNodeProject) detected.push('package.json');

    let detectedType: DetectionResult['detectedType'] = 'empty';
    let suggestedFlow: FlowDefinition | null = null;

    if (hasDocker && (hasNodeProject || hasGit)) {
        detectedType = 'full-stack';
        suggestedFlow = fullStackTemplate();
    } else if (hasDocker) {
        detectedType = 'docker-only';
        suggestedFlow = dockerOnlyTemplate();
    } else if (hasNodeProject || hasGit) {
        detectedType = 'script-only';
        suggestedFlow = scriptOnlyTemplate();
    }

    return {
        hasDocker,
        hasGit,
        hasNodeProject,
        detectedType,
        suggestedFlow,
        detectedFiles: detected,
    };
}
