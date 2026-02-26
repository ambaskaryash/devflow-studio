import { useState, useEffect } from 'react';
import { useFlowStore } from '../store/flowStore.ts';
import { listFlowVersions, getFlowVersion, deleteFlowVersions, FlowVersion } from '../lib/versionRepository.ts';
import { RotateCcw, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function FlowVersionPanel() {
    const { flowId, restoreSnapshot } = useFlowStore();
    const [versions, setVersions] = useState<FlowVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchVersions = async () => {
        setIsLoading(true);
        try {
            const data = await listFlowVersions(flowId);
            setVersions(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVersions();
    }, [flowId]);

    const handleRestore = async (versionId: string) => {
        if (!confirm('Restore this version? Currrent unsaved changes will be lost.')) return;
        try {
            const detail = await getFlowVersion(versionId);
            if (detail) {
                restoreSnapshot(detail.snapshot_json);
                toast.success('Version restored');
            }
        } catch (err) {
            toast.error(`Failed to restore: ${err}`);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('Are you sure you want to delete all version history for this flow?')) return;
        try {
            await deleteFlowVersions(flowId);
            setVersions([]);
            toast.success('Version history cleared');
        } catch (err) {
            toast.error(`Failed to clear: ${err}`);
        }
    };

    if (isLoading) return <div className="text-center py-8 text-gray-500 text-sm">Loading versions...</div>;

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-xs font-semibold text-gray-400">Total: {versions.length} versions</span>
                {versions.length > 0 && (
                    <button onClick={handleDeleteAll} className="text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-colors">
                        Clear History
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar px-2">
                {versions.length === 0 ? (
                    <div className="py-12 text-center text-gray-600 italic text-sm">
                        No versions saved yet. Click the Save button to create a snapshot.
                    </div>
                ) : (
                    versions.map(v => (
                        <div key={v.id} className="group p-3 rounded-xl border border-canvas-border bg-canvas-surface/30 hover:bg-canvas-surface transition-all flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-200 truncate">{v.commit_message}</div>
                                <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2 mt-1">
                                    <Clock size={10} />
                                    {new Date(v.created_at).toLocaleString()}
                                    <span className="bg-white/5 px-1.5 py-0.5 rounded ml-1">{v.node_count} nodes</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleRestore(v.id)}
                                title="Restore this version"
                                className="p-2 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            >
                                <RotateCcw size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="pt-3 mt-2 border-t border-canvas-border text-[10px] text-gray-500 text-center">
                Last 50 versions are stored in SQLite.
            </div>
        </div>
    );
}
