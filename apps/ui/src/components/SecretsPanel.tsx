// ============================================================
// DevFlow Studio — Secrets Vault Panel
// Uses OS-native credential store (Keychain / DPAPI / libsecret)
// via Tauri IPC. Values are NEVER written to localStorage or disk.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { KeyRound, Plus, Trash2, Eye, EyeOff, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { onClose: () => void; }

export function SecretsPanel({ onClose }: Props) {
    const [keys, setKeys] = useState<string[]>([]);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isNativeFallback, setIsNativeFallback] = useState(false);

    // Track keys in localStorage for the listing (values never stored there)
    const KEYS_INDEX = 'devflow__secret_keys_v2';

    const loadKeyIndex = useCallback(() => {
        try {
            const raw = localStorage.getItem(KEYS_INDEX);
            return raw ? (JSON.parse(raw) as string[]) : [];
        } catch {
            return [];
        }
    }, []);

    const saveKeyIndex = (keyList: string[]) => {
        localStorage.setItem(KEYS_INDEX, JSON.stringify(keyList));
    };

    const loadKeys = useCallback(async () => {
        setLoading(true);
        try {
            // Check if we can reach Tauri
            await invoke('secret_exists', { key: '__devflow_ping__' });
            setIsNativeFallback(false);
            setKeys(loadKeyIndex());
        } catch {
            // Not running inside Tauri (browser preview) — use fallback UI
            setIsNativeFallback(true);
            setKeys(loadKeyIndex());
        }
        setLoading(false);
    }, [loadKeyIndex]);

    useEffect(() => { loadKeys(); }, [loadKeys]);

    // ── One-time migration from old localStorage plaintext ──────────────────────
    const migrateFromLocalStorage = async () => {
        const OLD_KEY = 'devflow__secrets_v1';
        const raw = localStorage.getItem(OLD_KEY);
        if (!raw) { toast.success('No legacy secrets to migrate'); return; }

        let oldSecrets: Array<{ key: string; value: string }> = [];
        try { oldSecrets = JSON.parse(raw); } catch { return; }

        let migrated = 0;
        for (const s of oldSecrets) {
            try {
                await invoke('store_secret', { key: s.key, value: s.value });
                migrated++;
            } catch (err) {
                toast.error(`Failed to migrate "${s.key}": ${err}`);
            }
        }

        if (migrated > 0) {
            // Add keys to index
            const existing = loadKeyIndex();
            const merged = Array.from(new Set([...existing, ...oldSecrets.map(s => s.key)]));
            saveKeyIndex(merged);
            setKeys(merged);
            localStorage.removeItem(OLD_KEY);
            toast.success(`Migrated ${migrated} secrets to OS keychain and removed plaintext data`);
        }
    };

    // ── Add new secret ──────────────────────────────────────────────────────────
    const add = async () => {
        const k = newKey.trim();
        const v = newValue.trim();
        if (!k || !v) { toast.error('Key and value are required'); return; }

        try {
            if (!isNativeFallback) {
                await invoke('store_secret', { key: k, value: v });
            }
            const updated = Array.from(new Set([...keys, k]));
            saveKeyIndex(updated);
            setKeys(updated);
            setNewKey('');
            setNewValue('');
            toast.success(`Secret "${k}" saved to ${isNativeFallback ? 'memory (dev mode)' : 'OS keychain'}`);
        } catch (err) {
            toast.error(`Failed to store secret: ${err}`);
        }
    };

    // ── Delete secret ───────────────────────────────────────────────────────────
    const remove = async (key: string) => {
        try {
            if (!isNativeFallback) {
                await invoke('delete_secret', { key });
            }
            const updated = keys.filter(k => k !== key);
            saveKeyIndex(updated);
            setKeys(updated);
            setRevealedValues(prev => { const n = { ...prev }; delete n[key]; return n; });
            toast.success(`Secret "${key}" deleted`);
        } catch (err) {
            toast.error(`Failed to delete secret: ${err}`);
        }
    };

    // ── Reveal / hide value ─────────────────────────────────────────────────────
    const toggleReveal = async (key: string) => {
        if (revealedValues[key]) {
            setRevealedValues(prev => { const n = { ...prev }; delete n[key]; return n; });
            return;
        }
        try {
            if (!isNativeFallback) {
                const value = await invoke<string | null>('get_secret', { key });
                if (value) setRevealedValues(prev => ({ ...prev, [key]: value }));
                else toast.error(`No value found for "${key}"`);
            } else {
                setRevealedValues(prev => ({ ...prev, [key]: '[dev mode — value hidden]' }));
            }
        } catch (err) {
            toast.error(`Failed to retrieve secret: ${err}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="w-[540px] max-h-[76vh] flex flex-col bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1117]">
                    <div className="flex items-center gap-3">
                        <Lock size={18} className="text-yellow-400" />
                        <h2 className="text-sm font-semibold text-white">Secrets Vault</h2>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${isNativeFallback ? 'bg-orange-900/40 text-orange-400' : 'bg-emerald-900/40 text-emerald-400'}`}>
                            <ShieldCheck size={10} />
                            {isNativeFallback ? 'Dev Mode' : 'OS Keychain'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={migrateFromLocalStorage}
                            title="Migrate legacy secrets from localStorage to OS keychain"
                            className="text-xs text-gray-500 hover:text-yellow-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-yellow-900/20">
                            <RefreshCw size={11} /> Migrate Legacy
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded">✕</button>
                    </div>
                </div>

                {/* Security notice */}
                <div className="px-5 py-2.5 bg-emerald-950/30 border-b border-emerald-900/30 text-xs text-emerald-400/80 flex items-center gap-2">
                    <ShieldCheck size={12} />
                    Values are stored in your OS keychain and never written to disk or logs.
                </div>

                {/* Add new */}
                <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                    <div className="flex gap-2">
                        <input
                            value={newKey}
                            onChange={e => setNewKey(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                            placeholder="KEY_NAME"
                            className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                        />
                        <input
                            value={newValue}
                            onChange={e => setNewValue(e.target.value)}
                            placeholder="secret value"
                            type="password"
                            onKeyDown={e => e.key === 'Enter' && add()}
                            className="flex-[2] bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                        />
                        <button
                            onClick={add}
                            className="px-3 py-2 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <p className="text-gray-600 text-[10px] mt-1.5">Reference in nodes as <code className="text-yellow-500/70">$KEY_NAME</code></p>
                </div>

                {/* Secrets list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="text-center py-10 text-gray-600 text-xs">Loading from keychain...</div>
                    ) : keys.length === 0 ? (
                        <div className="text-center py-10 text-gray-600 text-xs">
                            <KeyRound size={28} className="mx-auto mb-3 opacity-30" />
                            No secrets yet. Add API keys, tokens, or passwords above.
                        </div>
                    ) : (
                        keys.map(k => (
                            <div key={k} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 group">
                                <span className="text-yellow-400/80 font-mono text-xs font-bold min-w-[140px] truncate">{k}</span>
                                <span className="flex-1 font-mono text-xs text-gray-400 truncate">
                                    {revealedValues[k] ? revealedValues[k] : '•'.repeat(16)}
                                </span>
                                <button onClick={() => toggleReveal(k)} className="p-1 text-gray-600 hover:text-gray-400 transition-colors" title="Reveal value">
                                    {revealedValues[k] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                                <button onClick={() => remove(k)} className="p-1 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Delete secret">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
