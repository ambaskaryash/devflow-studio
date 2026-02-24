// DevFlow Studio — Template Modal
// Browse and load pre-built flow templates.

import { useState } from 'react';
import { FLOW_TEMPLATES, instantiateTemplate, type FlowTemplate } from '../lib/templates.ts';
import { useFlowStore } from '../store/flowStore.ts';
import { X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_LABELS: Record<string, string> = {
    all: 'All',
    docker: '🐳 Docker',
    node: '📦 Node.js',
    python: '🐍 Python',
    kubernetes: '☸️ Kubernetes',
    ci: '⚙️ CI/CD',
    general: '🔧 General',
};

interface Props {
    onClose: () => void;
}

export function TemplateModal({ onClose }: Props) {
    const [filter, setFilter] = useState<string>('all');
    const { setFlow, setFlowName } = useFlowStore();

    const categories = ['all', ...Array.from(new Set(FLOW_TEMPLATES.map(t => t.category)))];
    const filtered = filter === 'all' ? FLOW_TEMPLATES : FLOW_TEMPLATES.filter(t => t.category === filter);

    const loadTemplate = (tpl: FlowTemplate) => {
        const { nodes, edges } = instantiateTemplate(tpl);
        setFlow(nodes, edges);
        setFlowName(tpl.name);
        toast.success(`Template "${tpl.name}" loaded!`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-[680px] max-h-[80vh] flex flex-col bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1117]">
                    <div className="flex items-center gap-3">
                        <Zap size={18} className="text-blue-400" />
                        <h2 className="text-sm font-semibold text-white">Flow Templates</h2>
                        <span className="text-xs text-gray-500">{FLOW_TEMPLATES.length} templates</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded">
                        <X size={16} />
                    </button>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 px-6 py-3 border-b border-white/5 overflow-x-auto flex-shrink-0">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap
                                ${filter === cat
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            {CATEGORY_LABELS[cat] ?? cat}
                        </button>
                    ))}
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-3">
                    {filtered.map(tpl => (
                        <button
                            key={tpl.id}
                            onClick={() => loadTemplate(tpl)}
                            className="text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/40 transition-all group"
                        >
                            <div className="flex items-start gap-3 mb-2">
                                <span className="text-2xl leading-none">{tpl.icon}</span>
                                <div>
                                    <div className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                                        {tpl.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">{tpl.nodes.length} nodes</div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">{tpl.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
