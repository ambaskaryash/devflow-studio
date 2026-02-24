// ============================================================
// DevFlow Studio — UI Plugin Service (Phase 3)
// Interacts with Tauri FS to load local plugins.
// ============================================================

import { readDir, readTextFile } from '@tauri-apps/plugin-fs';
import { join, homeDir } from '@tauri-apps/api/path';
import { registerNode, type NodeDefinition } from '../lib/nodeRegistry.ts';

export async function initializePlugins() {
    // Guard: Only run inside Tauri environment
    if (!(window as any).__TAURI_INTERNALS__) return;

    try {
        const home = await homeDir();
        const pluginsDir = await join(home, '.devflow-studio', 'plugins');

        // readDir will fail gracefully if directory doesn't exist
        const entries = await readDir(pluginsDir).catch(() => []);

        for (const entry of entries) {
            if (entry.isDirectory) {
                await loadPlugin(await join(pluginsDir, entry.name));
            }
        }
    } catch (err) {
        console.warn('[PluginService] Plugin directory not found or inaccessible. Skipping.', err);
    }
}

async function loadPlugin(path: string) {
    try {
        const manifestStr = await readTextFile(await join(path, 'plugin.json'));
        const manifest = JSON.parse(manifestStr);

        // Phase 4: Manifest Validation
        if (!manifest.id || !manifest.name || !manifest.version) {
            console.warn(`[PluginService] Invalid manifest at ${path}. Missing id, name, or version.`);
            return;
        }

        console.log(`[PluginService] Loading plugin: ${manifest.name} (${manifest.version})`);

        // Register the nodes defined in the plugin
        if (manifest.nodes && Array.isArray(manifest.nodes)) {
            for (const nodeDef of manifest.nodes) {
                // Prevent duplicate types
                const { isNodeRegistered } = await import('../lib/nodeRegistry.ts');
                if (isNodeRegistered(nodeDef.type)) {
                    console.warn(`[PluginService] Node type "${nodeDef.type}" is already registered. Skipping.`);
                    continue;
                }
                registerNode(nodeDef as NodeDefinition);
            }
        }
    } catch (err) {
        console.error(`[PluginService] Failed to load plugin at ${path}:`, err);
    }
}
