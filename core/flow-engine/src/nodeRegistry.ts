// ============================================================
// DevFlow Studio — Node Registry
// Central registry for all node type definitions.
// Enables plugin-ready architecture: future nodes register here.
// ============================================================

export interface ConfigField {
    key: string;
    label: string;
    type: 'text' | 'select' | 'toggle' | 'textarea';
    placeholder?: string;
    options?: string[];   // for select type
    mono?: boolean;
}

export interface NodeDefinition {
    type: string;
    label: string;
    icon: string;
    /** Tailwind gradient + border classes for the node card */
    colorClass: string;
    /** Tailwind bg class for node header */
    headerBgClass: string;
    /** Tailwind hover classes for toolbar button */
    hoverClass: string;
    /** Reference string matching executor handler */
    executionHandler: string;
    defaultConfig: Record<string, unknown>;
    configSchema: ConfigField[];
}

const _registry = new Map<string, NodeDefinition>();

/** Register a node definition. Overwrites if type already exists. */
export function registerNode(def: NodeDefinition): void {
    _registry.set(def.type, def);
}

/** Retrieve a node definition by type key. */
export function getNodeDef(type: string): NodeDefinition | undefined {
    return _registry.get(type);
}

/** Return all registered node definitions in insertion order. */
export function getAllNodeDefs(): NodeDefinition[] {
    return Array.from(_registry.values());
}

/** Check if a node type is registered. */
export function isNodeRegistered(type: string): boolean {
    return _registry.has(type);
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
