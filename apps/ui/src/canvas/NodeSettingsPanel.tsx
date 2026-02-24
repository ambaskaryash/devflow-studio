// ============================================================
// DevFlow Studio — Node Settings Panel (Registry-Driven)
// Dynamically renders form fields based on NodeDefinition schema.
// ============================================================

import type { ChangeEvent } from 'react';
import { useFlowStore } from '../store/flowStore.ts';
import { getNodeDef } from '../lib/nodeRegistry.ts';
import { X, Trash2 } from 'lucide-react';

function TextInput({
    label,
    value,
    onChange,
    placeholder,
    mono = false,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    mono?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`
                    bg-canvas-bg border border-canvas-border rounded-lg px-3 py-2 text-sm text-white
                    placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
                    transition-all ${mono ? 'font-mono' : ''}
                `}
            />
        </div>
    );
}

function TextArea({
    label,
    value,
    onChange,
    placeholder,
    mono = false,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    mono?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>
            <textarea
                value={value}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className={`
                    bg-canvas-bg border border-canvas-border rounded-lg px-3 py-2 text-sm text-white
                    placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
                    resize-none transition-all ${mono ? 'font-mono' : ''}
                `}
            />
        </div>
    );
}

function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{label}</span>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
            </button>
        </div>
    );
}

function SelectInput({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>
            <select
                value={value}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
                className="bg-canvas-bg border border-canvas-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
            >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

export function NodeSettingsPanel() {
    const { nodes, selectedNodeId, setSelectedNode, updateNodeConfig, removeNode } = useFlowStore();
    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    if (!selectedNode) {
        return (
            <div className="w-64 flex flex-col items-center justify-center h-full text-center p-6 gap-3">
                <div className="w-12 h-12 rounded-full bg-canvas-surface border border-canvas-border flex items-center justify-center text-2xl">
                    🎯
                </div>
                <p className="text-gray-500 text-sm">Select a node on the canvas to edit its settings</p>
            </div>
        );
    }

    const def = getNodeDef(selectedNode.data.nodeType);
    const cfg = selectedNode.data.config as Record<string, unknown>;
    const update = (key: string, val: unknown) => updateNodeConfig(selectedNode.id, { [key]: val });

    return (
        <div className="w-64 flex flex-col border-l border-canvas-border bg-canvas-surface animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-border">
                <div className="flex items-center gap-2">
                    <span className="text-base">{def?.icon || '🔌'}</span>
                    <span className="text-sm font-semibold text-white">{selectedNode.data.label}</span>
                </div>
                <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-500 hover:text-white transition-colors p-1 rounded"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Node ID */}
            <div className="px-4 pt-3">
                <p className="text-xs text-gray-600 font-mono">ID: {selectedNode.id}</p>
            </div>

            {/* Dynamic Config fields from Registry */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 no-scrollbar">
                {def?.configSchema.map(field => {
                    const value = cfg[field.key];

                    if (field.type === 'text') {
                        let displayValue = '';
                        if (Array.isArray(value)) displayValue = value.join(', ');
                        else displayValue = String(value ?? '');

                        return (
                            <TextInput
                                key={field.key}
                                label={field.label}
                                value={displayValue}
                                placeholder={field.placeholder}
                                mono={field.mono}
                                onChange={v => {
                                    // Special handling for ports (comma separated)
                                    if (field.key === 'ports') {
                                        update(field.key, v.split(',').map(s => s.trim()).filter(Boolean));
                                    } else {
                                        update(field.key, v);
                                    }
                                }}
                            />
                        );
                    }

                    if (field.type === 'textarea') {
                        return (
                            <TextArea
                                key={field.key}
                                label={field.label}
                                value={String(value ?? '')}
                                placeholder={field.placeholder}
                                mono={field.mono}
                                onChange={v => update(field.key, v)}
                            />
                        );
                    }

                    if (field.type === 'toggle') {
                        return (
                            <Toggle
                                key={field.key}
                                label={field.label}
                                checked={!!value}
                                onChange={v => update(field.key, v)}
                            />
                        );
                    }

                    if (field.type === 'select') {
                        return (
                            <SelectInput
                                key={field.key}
                                label={field.label}
                                value={String(value ?? 'auto')}
                                options={field.options || []}
                                onChange={v => update(field.key, v)}
                            />
                        );
                    }

                    return null;
                })}
            </div>

            {/* Delete button */}
            <div className="px-4 py-3 border-t border-canvas-border">
                <button
                    onClick={() => removeNode(selectedNode.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-all text-sm font-medium"
                >
                    <Trash2 size={14} />
                    Remove Node
                </button>
            </div>
        </div>
    );
}
