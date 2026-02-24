// DevFlow Studio — Secrets Panel
// Encrypted local storage for API keys and tokens.

import { useState, useEffect } from 'react';
import { KeyRound, Plus, Trash2, Eye, EyeOff, Copy, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Secret {
    id: string;
    key: string;
    value: string;
    createdAt: string;
}

const STORAGE_KEY = 'devflow__secrets_v1';

function loadSecrets(): Secret[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
    catch { return []; }
}

function saveSecrets(s: Secret[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

interface Props { onClose: () => void; }

export function SecretsPanel({ onClose }: Props) {
    const [secrets, setSecrets] = useState<Secret[]>(loadSecrets);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [visible, setVisible] = useState<Record<string, boolean>>({});

    useEffect(() => saveSecrets(secrets), [secrets]);

    const add = () => {
        if (!newKey.trim() || !newValue.trim()) return;
        const s: Secret = { id: crypto.randomUUID(), key: newKey.trim(), value: newValue.trim(), createdAt: new Date().toISOString() };
        setSecrets(prev => [...prev, s]);
        setNewKey(''); setNewValue('');
        toast.success(`Secret "${s.key}" saved`);
    };

    const remove = (id: string) => {
        setSecrets(prev => prev.filter(s => s.id !== id));
        toast.success('Secret deleted');
    };

    const copy = (value: string) => {
        navigator.clipboard.writeText(value);
        toast.success('Copied to clipboard');
    };

    const toggleVisible = (id: string) => setVisible(v => ({ ...v, [id]: !v[id] }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="w-[520px] max-h-[75vh] flex flex-col bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1117]">
                    <div className="flex items-center gap-3">
                        <Lock size={18} className="text-yellow-400" />
                        <h2 className="text-sm font-semibold text-white">Secrets Vault</h2>
                        <span className="text-xs text-gray-500">stored in localStorage</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded">✕</button>
                </div>

                {/* Add new */}
                <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                    <div className="flex gap-2">
                        <input
                            value={newKey}
                            onChange={e => setNewKey(e.target.value)}
                            placeholder="KEY_NAME"
                            className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                        />
                        <input
                            value={newValue}
                            onChange={e => setNewValue(e.target.value)}
                            placeholder="value"
                            type="password"
                            className="flex-[2] bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                        />
                        <button
                            onClick={add}
                            className="px-3 py-2 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                {/* Secrets list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {secrets.length === 0 ? (
                        <div className="text-center py-10 text-gray-600 text-xs">
                            <KeyRound size={28} className="mx-auto mb-3 opacity-30" />
                            No secrets yet. Add API keys, tokens, passwords above.
                        </div>
                    ) : (
                        secrets.map(s => (
                            <div key={s.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 group">
                                <span className="text-yellow-400/80 font-mono text-xs font-bold min-w-[120px] truncate">{s.key}</span>
                                <span className="flex-1 font-mono text-xs text-gray-400 truncate">
                                    {visible[s.id] ? s.value : '•'.repeat(Math.min(16, s.value.length))}
                                </span>
                                <button onClick={() => toggleVisible(s.id)} className="p-1 text-gray-600 hover:text-gray-400 transition-colors">
                                    {visible[s.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                                <button onClick={() => copy(s.value)} className="p-1 text-gray-600 hover:text-blue-400 transition-colors">
                                    <Copy size={12} />
                                </button>
                                <button onClick={() => remove(s.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
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
