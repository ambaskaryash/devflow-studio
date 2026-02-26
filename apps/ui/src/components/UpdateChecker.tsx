import { useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function UpdateChecker() {
    const [isChecking, setIsChecking] = useState(false);
    const [statusText, setStatusText] = useState('');

    const checkForUpdate = async () => {
        setIsChecking(true);
        setStatusText('Checking...');
        try {
            const update = await check();
            if (update) {
                setStatusText(`v${update.version} available`);
                toast(
                    (t) => (
                        <div className="flex flex-col gap-2">
                            <span className="font-semibold text-sm">Update Available: v{update.version}</span>
                            <span className="text-xs text-gray-400">
                                {update.body || 'A new version of DevFlow Studio is ready to be installed.'}
                            </span>
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                                >
                                    Later
                                </button>
                                <button
                                    onClick={async () => {
                                        toast.dismiss(t.id);
                                        toast.loading(`Downloading v${update.version}...`, { id: 'update' });
                                        try {
                                            await update.downloadAndInstall();
                                            toast.success('Update installed! Please close and reopen DevFlow Studio to apply the changes.', { id: 'update', duration: 15000 });
                                        } catch (e) {
                                            toast.error(`Update failed: ${e}`, { id: 'update' });
                                        }
                                    }}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors flex items-center gap-2"
                                >
                                    <Download size={14} /> Install Update
                                </button>
                            </div>
                        </div>
                    ),
                    { duration: Infinity, position: 'bottom-right' }
                );
            } else {
                setStatusText('Up to date');
                toast.success('You are on the latest version!');
                setTimeout(() => setStatusText(''), 3000);
            }
        } catch (error) {
            console.error('Update check failed:', error);
            setStatusText('Update error');
            toast.error(`Auto-updater could not connect. You can download the latest version from GitHub releases.`);
            setTimeout(() => setStatusText(''), 3000);
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <button
            onClick={checkForUpdate}
            disabled={isChecking}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium flex-shrink-0 ${statusText.includes('available') ? 'text-blue-400 bg-blue-900/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-gray-400 hover:bg-canvas-elevated hover:text-white'}`}
            title="Check for updates"
        >
            {isChecking ? <RefreshCw size={14} className="animate-spin text-blue-400" /> : statusText === 'Up to date' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Download size={14} />}
            <span className="hidden md:block transition-all">{statusText || 'Check Updates'}</span>
        </button>
    );
}
