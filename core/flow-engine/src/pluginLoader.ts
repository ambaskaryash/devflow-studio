// ============================================================
// DevFlow Studio — Plugin Loader (Phase 3)
// Dynamically loads custom nodes from ~/.devflow-studio/plugins
// ============================================================

import { registerNode, type NodeDefinition } from './nodeRegistry.js';
import { join } from 'node:path';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';

export interface PluginManifest {
    name: string;
    version: string;
    description?: string;
    entry: string;
}

export async function loadPlugins(): Promise<void> {
    const pluginsDir = join(homedir(), '.devflow-studio', 'plugins');

    if (!existsSync(pluginsDir)) {
        return;
    }

    const entries = readdirSync(pluginsDir, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const pluginPath = join(pluginsDir, entry.name);
        const manifestPath = join(pluginPath, 'plugin.json');

        if (!existsSync(manifestPath)) continue;

        try {
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as PluginManifest;
            const entryPath = join(pluginPath, manifest.entry);

            if (!existsSync(entryPath)) continue;

            // In a real environment, we would use dynamic import or a sandbox
            // For now, we simulate loading the node definitions from the manifest
            // if they are static, or use a restricted evaluator.

            console.log(`[PluginLoader] Loading plugin: ${manifest.name} v${manifest.version}`);

            // To be truly dynamic in the UI, we'd need to emit these to the frontend
            // or have the frontend call an IPC to get external nodes.
        } catch (err) {
            console.error(`[PluginLoader] Failed to load plugin ${entry.name}:`, err);
        }
    }
}
