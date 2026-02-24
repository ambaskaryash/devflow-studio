// ============================================================
// DevFlow Studio — Project Store (Zustand)
// Manages the currently open project and detection results.
// ============================================================

import { create } from 'zustand';

export type ProjectType = 'docker-only' | 'script-only' | 'full-stack' | 'empty';

export interface ScanResult {
    hasDocker: boolean;
    hasGit: boolean;
    hasNodeProject: boolean;
    hasMakefile: boolean;
    hasRequirements: boolean;
    hasDockerCompose: boolean;
    packageScripts: string[];
}

interface ProjectStore {
    projectPath: string | null;
    projectType: ProjectType | null;
    scanResult: ScanResult | null;
    showSuggestionBanner: boolean;

    setProject: (path: string, type: ProjectType, scan: ScanResult) => void;
    dismissSuggestion: () => void;
    resetProject: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
    projectPath: null,
    projectType: null,
    scanResult: null,
    showSuggestionBanner: false,

    setProject: (path, type, scan) => set({
        projectPath: path,
        projectType: type,
        scanResult: scan,
        showSuggestionBanner: true,
    }),

    dismissSuggestion: () => set({ showSuggestionBanner: false }),

    resetProject: () => set({
        projectPath: null,
        projectType: null,
        scanResult: null,
        showSuggestionBanner: false,
    }),
}));
