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

