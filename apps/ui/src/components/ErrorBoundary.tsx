// ============================================================
// DevFlow Studio — Error Boundary
// Graceful handling of React runtime crashes.
// ============================================================

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReset = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-canvas-bg flex items-center justify-center p-6 font-sans">
                    <div className="max-w-xl w-full bg-canvas-elevated border-2 border-red-500/20 rounded-3xl shadow-2xl p-8 space-y-8 animate-in fade-in zoom-in duration-300">
                        <div className="space-y-4 text-center">
                            <div className="inline-flex p-4 bg-red-500/10 rounded-2xl text-red-500">
                                <AlertTriangle size={48} />
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Something went wrong</h1>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                DevFlow Studio encountered an unexpected runtime error. Your local data is safe, but the UI needs to be reset.
                            </p>
                        </div>

                        {/* Error Detail */}
                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 overflow-hidden">
                            <div className="flex items-center gap-2 mb-2 text-red-400">
                                <Terminal size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Diagnostic Info</span>
                            </div>
                            <pre className="text-[11px] font-mono text-gray-500 overflow-x-auto whitespace-pre-wrap line-clamp-4">
                                {this.state.error?.message}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                <RefreshCw size={18} />
                                Refresh Workbench
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-3 text-gray-500 hover:text-white text-sm font-medium transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
