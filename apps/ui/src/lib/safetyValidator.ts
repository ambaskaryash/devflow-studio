// ============================================================
// DevFlow Studio — Safety Validator  (Phase 2)
// Pattern-based detection of dangerous shell commands.
// Purely local, no network, cross-platform.
// ============================================================

export type SafetySeverity = 'warn' | 'danger';

export interface SafetyIssue {
    pattern: string;
    severity: SafetySeverity;
    message: string;
}

interface SafetyRule {
    regex: RegExp;
    severity: SafetySeverity;
    message: string;
    friendlyPattern: string;
}

const SAFETY_RULES: SafetyRule[] = [
    // ── Disk destruction ────────────────────────────────────────────────────
    {
        regex: /rm\s+-[a-zA-Z]*r[a-zA-Z]*f\s+(\/\*|\/\s*$|~\/?\s*$|\$HOME\s*$)/i,
        severity: 'danger',
        message: 'Recursive forced delete of root or home directory',
        friendlyPattern: 'rm -rf / | rm -rf ~',
    },
    {
        regex: /rm\s+-[a-zA-Z]*r[a-zA-Z]*/i,
        severity: 'warn',
        message: 'Recursive file deletion detected',
        friendlyPattern: 'rm -r ...',
    },
    {
        regex: /sudo\s+rm/i,
        severity: 'danger',
        message: 'Privileged recursive delete — may require your password and affect system files',
        friendlyPattern: 'sudo rm',
    },
    // ── Docker system operations ────────────────────────────────────────────
    {
        regex: /docker\s+system\s+prune/i,
        severity: 'warn',
        message: 'Docker system prune removes ALL stopped containers, dangling images, networks',
        friendlyPattern: 'docker system prune',
    },
    {
        regex: /docker\s+volume\s+prune/i,
        severity: 'warn',
        message: 'Docker volume prune removes ALL unused volumes — potential data loss',
        friendlyPattern: 'docker volume prune',
    },
    // ── Disk writing ─────────────────────────────────────────────────────────
    {
        regex: /dd\s+if=/i,
        severity: 'danger',
        message: 'dd can overwrite entire disks — verify source and destination carefully',
        friendlyPattern: 'dd if=...',
    },
    {
        regex: /mkfs\./i,
        severity: 'danger',
        message: 'mkfs formats a filesystem — will destroy all data on the target device',
        friendlyPattern: 'mkfs.*',
    },
    {
        regex: />\s*\/dev\/(sd[a-z]|nvme|hd[a-z])/i,
        severity: 'danger',
        message: 'Writing directly to a block device — this can corrupt your disk',
        friendlyPattern: '> /dev/sda',
    },
    // ── Fork bomb ────────────────────────────────────────────────────────────
    {
        regex: /:\s*\(\s*\)\s*\{/,
        severity: 'danger',
        message: 'Possible fork bomb pattern detected — will exhaust system resources',
        friendlyPattern: ':(){:|:&};:',
    },
    // ── Privilege escalation ─────────────────────────────────────────────────
    {
        regex: /chmod\s+-?R\s+777\s+\//i,
        severity: 'warn',
        message: 'chmod 777 on / makes all system files world-writable — severe security risk',
        friendlyPattern: 'chmod -R 777 /',
    },
    // ── Piped install (curl/wget | bash) ─────────────────────────────────────
    {
        regex: /(curl|wget)\s+.*\|\s*(sudo\s+)?(bash|sh)/i,
        severity: 'warn',
        message: 'Piped install — executing remote scripts without review',
        friendlyPattern: 'curl | bash',
    },
    // ── History wipe ─────────────────────────────────────────────────────────
    {
        regex: />\s*~\/\.(bash|zsh)_history/i,
        severity: 'warn',
        message: 'Clearing shell history',
        friendlyPattern: '> ~/.bash_history',
    },
];

/**
 * Validate a shell command string against known dangerous patterns.
 * Returns an array of SafetyIssue objects (empty = safe).
 */
export function validateCommandSafety(command: string): SafetyIssue[] {
    const issues: SafetyIssue[] = [];
    for (const rule of SAFETY_RULES) {
        if (rule.regex.test(command)) {
            issues.push({
                pattern: rule.friendlyPattern,
                severity: rule.severity,
                message: rule.message,
            });
        }
    }
    return issues;
}

export interface NodeSafetyReport {
    nodeId: string;
    nodeLabel: string;
    command: string;
    issues: SafetyIssue[];
}

/**
 * Validate all commands extracted from a node list.
 * Returns only nodes that have at least one issue.
 */
export function validateFlowSafety(
    nodes: Array<{ id: string; label: string; nodeType: string; config: Record<string, unknown> }>,
): NodeSafetyReport[] {
    const reports: NodeSafetyReport[] = [];

    for (const node of nodes) {
        const commands: string[] = [];

        if (node.nodeType === 'scriptRun') {
            const cmd = node.config['command'];
            if (typeof cmd === 'string' && cmd.trim()) commands.push(cmd);
        } else if (node.nodeType === 'dockerBuild') {
            // Validate build args / context paths (rarely dangerous, but check anyway)
            const ctx = node.config['context'];
            if (typeof ctx === 'string') commands.push(`docker build -t ... ${ctx}`);
        } else if (node.nodeType === 'dockerRun') {
            const img = node.config['image'];
            if (typeof img === 'string') commands.push(`docker run ${img}`);
        }

        const allIssues: SafetyIssue[] = commands.flatMap(c => validateCommandSafety(c));
        if (allIssues.length > 0) {
            reports.push({ nodeId: node.id, nodeLabel: node.label, command: commands.join('\n'), issues: allIssues });
        }
    }

    return reports;
}
