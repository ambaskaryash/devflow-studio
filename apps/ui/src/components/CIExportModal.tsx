import { useState, useEffect } from 'react';
import { X, Download, Copy, Check, GitBranch } from 'lucide-react';
import { useFlowStore } from '../store/flowStore.ts';
import { exportGitHubActions, exportGitLabCI, exportJenkinsPipeline, exportDockerCompose } from '../lib/ciExporters.ts';

const TABS = [
    { id: 'github', label: 'GitHub Actions', ext: 'yml', name: '.github/workflows/devflow.yml' },
    { id: 'gitlab', label: 'GitLab CI', ext: 'yml', name: '.gitlab-ci.yml' },
    { id: 'jenkins', label: 'Jenkins Pipeline', ext: 'groovy', name: 'Jenkinsfile' },
    { id: 'compose', label: 'Docker Compose', ext: 'yml', name: 'docker-compose.yml' }
];

export function CIExportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { nodes, edges, flowName } = useFlowStore();
    const [activeTab, setActiveTab] = useState(TABS[0].id);
    const [content, setContent] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        let result = '';
        switch (activeTab) {
            case 'github': result = exportGitHubActions(nodes, edges, flowName); break;
            case 'gitlab': result = exportGitLabCI(nodes, edges, flowName); break;
            case 'jenkins': result = exportJenkinsPipeline(nodes, edges, flowName); break;
            case 'compose': result = exportDockerCompose(nodes, edges, flowName); break;
        }
        setContent(result);
    }, [activeTab, isOpen, nodes, edges, flowName]);

    if (!isOpen) return null;

    const currentTab = TABS.find(t => t.id === activeTab)!;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", currentTab.name);
        dlAnchorElem.click();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161b22]">
                    <div className="flex items-center gap-3">
                        <GitBranch size={18} className="text-purple-400" />
                        <div>
                            <h2 className="text-base font-semibold text-white">Export CI/CD Pipeline</h2>
                            <p className="text-[10px] text-gray-500">Convert the visual DevFlow graph to a text-based pipeline.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Main */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-56 border-r border-white/10 bg-[#161b22] px-3 py-4 space-y-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 bg-[#0d1117]/80 sticky top-0">
                            <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">
                                {currentTab.name}
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors border border-white/10">
                                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                                <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors">
                                    <Download size={14} /> Download
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            <pre className="text-[11px] font-mono leading-relaxed text-blue-200">
                                {content}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
