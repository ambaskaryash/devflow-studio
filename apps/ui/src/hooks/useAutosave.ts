// ============================================================
// DevFlow Studio — useAutosave Hook  (Phase 2)
// Debounced Zustand watcher that saves flow versions on change.
// ============================================================

import { useEffect, useRef } from 'react';
import { useFlowStore } from '../store/flowStore.ts';

const DEBOUNCE_MS = 1200; // 1.2s after last change

/**
 * Mount this hook once (in Toolbar or App) to enable autosave.
 * On every node/edge change, it debounces 1.2s then saves a version.
 */
export function useAutosave() {
    const nodes = useFlowStore(s => s.nodes);
    const edges = useFlowStore(s => s.edges);
    const isRunning = useFlowStore(s => s.isRunning);
    const saveVersion = useFlowStore(s => s.saveVersion);
    const markSaved = useFlowStore(s => s.markSaved);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Track if it's the very first render (don't autosave empty initial state)
    const mountRef = useRef(true);

    useEffect(() => {
        if (mountRef.current) { mountRef.current = false; return; }
        // Don't autosave while a flow is actively running (noisy)
        if (isRunning) return;
        // Don't autosave empty canvas
        if (nodes.length === 0) return;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            saveVersion('Autosave');
            markSaved();
        }, DEBOUNCE_MS);

        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);
}
