// ============================================================
// DevFlow Studio — UI Node Registry (local copy for Vite)
// Mirrors core/flow-engine/src/nodeRegistry.ts for frontend use.
// Single source of truth for all node visual definitions.
// ============================================================

export interface ConfigField {
    key: string;
    label: string;
    type: 'text' | 'select' | 'toggle' | 'textarea';
    placeholder?: string;
    options?: string[];
    mono?: boolean;
}

export interface NodeDefinition {
    type: string;
    label: string;
    icon: string;
    colorClass: string;
    headerBgClass: string;
    hoverClass: string;
    executionHandler: string | ((config: Record<string, any>, context: any) => Promise<any>);
    defaultConfig: Record<string, unknown>;
    configSchema: ConfigField[];
}

const _registry = new Map<string, NodeDefinition>();

export function registerNode(def: NodeDefinition): void {
    _registry.set(def.type, def);
}

export function getNodeDef(type: string): NodeDefinition | undefined {
    return _registry.get(type);
}

export function getAllNodeDefs(): NodeDefinition[] {
    return Array.from(_registry.values());
}

export function isNodeRegistered(type: string): boolean {
    return _registry.has(type);
}

export function getExecutionHandler(type: string) {
    return _registry.get(type)?.executionHandler;
}

// ============================================================
// Built-in Node Registrations
// ============================================================

registerNode({
    type: 'gitPull',
    label: 'Git Pull',
    icon: '📥',
    colorClass: 'from-green-600/20 to-green-800/10 border-green-600/40',
    headerBgClass: 'bg-green-600/30',
    hoverClass: 'hover:bg-green-900/20 hover:border-green-600/40 hover:text-green-400',
    executionHandler: 'gitPullHandler',
    defaultConfig: { remote: 'origin', branch: 'main', directory: '' },
    configSchema: [
        { key: 'remote', label: 'Remote', type: 'text', placeholder: 'origin' },
        { key: 'branch', label: 'Branch', type: 'text', placeholder: 'main' },
        { key: 'directory', label: 'Directory', type: 'text', placeholder: '/path/to/repo', mono: true },
    ],
});

registerNode({
    type: 'dockerBuild',
    label: 'Docker Build',
    icon: '🐳',
    colorClass: 'from-blue-600/20 to-blue-800/10 border-blue-600/40',
    headerBgClass: 'bg-blue-600/30',
    hoverClass: 'hover:bg-blue-900/20 hover:border-blue-600/40 hover:text-blue-400',
    executionHandler: 'dockerBuildHandler',
    defaultConfig: { context: '.', tag: 'myapp:latest', dockerfile: 'Dockerfile' },
    configSchema: [
        { key: 'context', label: 'Build Context', type: 'text', placeholder: '.', mono: true },
        { key: 'tag', label: 'Image Tag', type: 'text', placeholder: 'myapp:latest', mono: true },
        { key: 'dockerfile', label: 'Dockerfile', type: 'text', placeholder: 'Dockerfile', mono: true },
    ],
});

registerNode({
    type: 'dockerRun',
    label: 'Docker Run',
    icon: '▶️',
    colorClass: 'from-orange-600/20 to-orange-800/10 border-orange-600/40',
    headerBgClass: 'bg-orange-600/30',
    hoverClass: 'hover:bg-orange-900/20 hover:border-orange-600/40 hover:text-orange-400',
    executionHandler: 'dockerRunHandler',
    defaultConfig: { image: 'myapp:latest', ports: ['3000:3000'], detach: false, remove: true },
    configSchema: [
        { key: 'image', label: 'Image', type: 'text', placeholder: 'myapp:latest', mono: true },
        { key: 'ports', label: 'Ports (comma-sep)', type: 'text', placeholder: '3000:3000', mono: true },
        { key: 'name', label: 'Container Name', type: 'text', placeholder: 'my-container' },
        { key: 'detach', label: 'Detach (-d)', type: 'toggle' },
        { key: 'remove', label: 'Auto Remove (--rm)', type: 'toggle' },
    ],
});

registerNode({
    type: 'scriptRun',
    label: 'Script Run',
    icon: '💻',
    colorClass: 'from-purple-600/20 to-purple-800/10 border-purple-600/40',
    headerBgClass: 'bg-purple-600/30',
    hoverClass: 'hover:bg-purple-900/20 hover:border-purple-600/40 hover:text-purple-400',
    executionHandler: 'scriptHandler',
    defaultConfig: { command: 'echo Hello DevFlow!', shell: 'bash', workingDir: '' },
    configSchema: [
        { key: 'command', label: 'Command', type: 'textarea', placeholder: 'echo Hello DevFlow!', mono: true },
        { key: 'shell', label: 'Shell', type: 'select', options: ['auto', 'bash', 'sh', 'zsh', 'powershell'] },
        { key: 'workingDir', label: 'Working Dir', type: 'text', placeholder: '/path/to/dir', mono: true },
    ],
});

registerNode({
    type: 'conditionalNode',
    label: 'Condition',
    icon: '❓',
    colorClass: 'from-amber-600/20 to-amber-800/10 border-amber-600/40',
    headerBgClass: 'bg-amber-600/30',
    hoverClass: 'hover:bg-amber-900/20 hover:border-amber-600/40 hover:text-amber-400',
    executionHandler: 'conditionalHandler',
    defaultConfig: { condition: 'exit_code == 0' },
    configSchema: [
        { key: 'condition', label: 'If Condition', type: 'text', placeholder: 'exit_code == 0', mono: true },
    ],
});

registerNode({
    type: 'parallelGroup',
    label: 'Parallel Batch',
    icon: '🔀',
    colorClass: 'from-indigo-600/20 to-indigo-800/10 border-indigo-600/40',
    headerBgClass: 'bg-indigo-600/30',
    hoverClass: 'hover:bg-indigo-900/20 hover:border-indigo-600/40 hover:text-indigo-400',
    executionHandler: 'parallelHandler',
    defaultConfig: { mode: 'all' },
    configSchema: [
        { key: 'mode', label: 'Execution Mode', type: 'select', options: ['all', 'race'] },
    ],
});

registerNode({
    type: 'delayNode',
    label: 'Delay',
    icon: '⏳',
    colorClass: 'from-gray-600/20 to-gray-800/10 border-gray-600/40',
    headerBgClass: 'bg-gray-600/30',
    hoverClass: 'hover:bg-gray-900/20 hover:border-gray-600/40 hover:text-gray-400',
    executionHandler: 'delayHandler',
    defaultConfig: { seconds: 5 },
    configSchema: [
        { key: 'seconds', label: 'Wait Seconds', type: 'text', placeholder: '5' },
    ],
});

// ── New P0 Node Types ──────────────────────────────────────────────────────────

registerNode({
    type: 'npmRun',
    label: 'NPM Script',
    icon: '📦',
    colorClass: 'from-red-600/20 to-red-800/10 border-red-600/40',
    headerBgClass: 'bg-red-600/30',
    hoverClass: 'hover:bg-red-900/20 hover:border-red-600/40 hover:text-red-400',
    executionHandler: 'npmRunHandler',
    defaultConfig: { script: 'build', packageDir: '' },
    configSchema: [
        { key: 'script', label: 'Script Name', type: 'text', placeholder: 'build', mono: true },
        { key: 'packageDir', label: 'Package Directory', type: 'text', placeholder: './apps/ui', mono: true },
    ],
});

registerNode({
    type: 'pipInstall',
    label: 'Pip Install',
    icon: '🐍',
    colorClass: 'from-yellow-600/20 to-yellow-800/10 border-yellow-600/40',
    headerBgClass: 'bg-yellow-600/30',
    hoverClass: 'hover:bg-yellow-900/20 hover:border-yellow-600/40 hover:text-yellow-400',
    executionHandler: 'pipInstallHandler',
    defaultConfig: { requirements: 'requirements.txt', venv: false, venvDir: '.venv' },
    configSchema: [
        { key: 'requirements', label: 'Requirements File', type: 'text', placeholder: 'requirements.txt', mono: true },
        { key: 'venv', label: 'Use Virtual Env', type: 'toggle' },
        { key: 'venvDir', label: 'Venv Directory', type: 'text', placeholder: '.venv', mono: true },
    ],
});

registerNode({
    type: 'makeTarget',
    label: 'Make',
    icon: '🔨',
    colorClass: 'from-cyan-600/20 to-cyan-800/10 border-cyan-600/40',
    headerBgClass: 'bg-cyan-600/30',
    hoverClass: 'hover:bg-cyan-900/20 hover:border-cyan-600/40 hover:text-cyan-400',
    executionHandler: 'makeTargetHandler',
    defaultConfig: { target: 'build', jobs: '4' },
    configSchema: [
        { key: 'target', label: 'Make Target', type: 'text', placeholder: 'build', mono: true },
        { key: 'jobs', label: 'Parallel Jobs (-j)', type: 'text', placeholder: '4' },
    ],
});

registerNode({
    type: 'kubectlApply',
    label: 'Kubectl Apply',
    icon: '☸️',
    colorClass: 'from-sky-600/20 to-sky-800/10 border-sky-600/40',
    headerBgClass: 'bg-sky-600/30',
    hoverClass: 'hover:bg-sky-900/20 hover:border-sky-600/40 hover:text-sky-400',
    executionHandler: 'kubectlApplyHandler',
    defaultConfig: { manifest: 'k8s/', namespace: 'default', dryRun: false },
    configSchema: [
        { key: 'manifest', label: 'Manifest Path', type: 'text', placeholder: 'k8s/deployment.yaml', mono: true },
        { key: 'namespace', label: 'Namespace', type: 'text', placeholder: 'default' },
        { key: 'dryRun', label: 'Dry Run', type: 'toggle' },
    ],
});

registerNode({
    type: 'dockerCompose',
    label: 'Docker Compose',
    icon: '🐋',
    colorClass: 'from-blue-500/20 to-blue-700/10 border-blue-500/40',
    headerBgClass: 'bg-blue-500/30',
    hoverClass: 'hover:bg-blue-800/20 hover:border-blue-500/40 hover:text-blue-300',
    executionHandler: 'dockerComposeHandler',
    defaultConfig: { action: 'up', file: 'docker-compose.yml', detach: true },
    configSchema: [
        { key: 'action', label: 'Action', type: 'select', options: ['up', 'down', 'build', 'restart', 'logs', 'ps'] },
        { key: 'file', label: 'Compose File', type: 'text', placeholder: 'docker-compose.yml', mono: true },
        { key: 'detach', label: 'Detach (-d)', type: 'toggle' },
    ],
});

registerNode({
    type: 'testRunner',
    label: 'Test Runner',
    icon: '🧪',
    colorClass: 'from-emerald-600/20 to-emerald-800/10 border-emerald-600/40',
    headerBgClass: 'bg-emerald-600/30',
    hoverClass: 'hover:bg-emerald-900/20 hover:border-emerald-600/40 hover:text-emerald-400',
    executionHandler: 'testRunnerHandler',
    defaultConfig: { framework: 'jest', pattern: '', coverage: false },
    configSchema: [
        { key: 'framework', label: 'Framework', type: 'select', options: ['jest', 'pytest', 'go test', 'cargo test', 'mocha', 'vitest'] },
        { key: 'pattern', label: 'Test Pattern', type: 'text', placeholder: 'src/**/*.test.ts', mono: true },
        { key: 'coverage', label: 'Generate Coverage', type: 'toggle' },
    ],
});

registerNode({
    type: 'notification',
    label: 'Send Notification',
    icon: '🔔',
    colorClass: 'from-violet-600/20 to-violet-800/10 border-violet-600/40',
    headerBgClass: 'bg-violet-600/30',
    hoverClass: 'hover:bg-violet-900/20 hover:border-violet-600/40 hover:text-violet-400',
    executionHandler: 'notificationHandler',
    defaultConfig: { title: 'DevFlow', message: 'Step completed!', sound: true },
    configSchema: [
        { key: 'title', label: 'Title', type: 'text', placeholder: 'DevFlow' },
        { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Step completed!' },
        { key: 'sound', label: 'Play Sound', type: 'toggle' },
    ],
});


