// ============================================================
// DevFlow Studio — Shell Abstraction
// Detects OS and returns appropriate shell executable
// ============================================================

export type ShellType = 'bash' | 'sh' | 'zsh' | 'powershell';

export interface ShellConfig {
    executable: string;
    args: string[];
}

export function detectShell(preferred?: string): ShellConfig {
    if (preferred && preferred !== 'auto') {
        return buildShellConfig(preferred as ShellType);
    }

    const platform = process.platform;

    if (platform === 'win32') {
        return {
            executable: 'powershell.exe',
            args: ['-NoProfile', '-NonInteractive', '-Command'],
        };
    }

    // Unix-like: prefer bash, fallback to sh
    const shell = process.env.SHELL ?? '/bin/sh';
    if (shell.endsWith('zsh')) return { executable: 'zsh', args: ['-c'] };
    if (shell.endsWith('bash')) return { executable: 'bash', args: ['-c'] };
    return { executable: 'sh', args: ['-c'] };
}

function buildShellConfig(shell: ShellType): ShellConfig {
    switch (shell) {
        case 'bash': return { executable: 'bash', args: ['-c'] };
        case 'zsh': return { executable: 'zsh', args: ['-c'] };
        case 'sh': return { executable: 'sh', args: ['-c'] };
        case 'powershell': return { executable: 'powershell.exe', args: ['-Command'] };
        default: return { executable: 'sh', args: ['-c'] };
    }
}
