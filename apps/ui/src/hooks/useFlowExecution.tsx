// ============================================================
// DevFlow Studio — Flow Execution Hook (Phase 3+5)
// Logic for running, retrying, and resuming flows.
// Integrates retry strategies, execution profiles, and secure secrets.
// ============================================================

import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useFlowStore } from '../store/flowStore.ts';
import { useProjectStore } from '../store/projectStore.ts';
import { toast } from 'react-hot-toast';
import { metricService } from '../lib/metricService.ts';
import { retryWithPolicy, waitForCondition } from '../lib/retryStrategy.ts';
import { DEFAULT_RETRY_POLICY } from '../lib/errorTypes.ts';

export function useFlowExecution() {
    const {
        nodes, edges, isRunning, setIsRunning,
        addLog, updateNodeStatus, clearLogs,
        startNodeExecution, finishNodeExecution, clearTimeline,
        setCheckpoint
    } = useFlowStore();

    const { projectPath } = useProjectStore();

    const runFlow = useCallback(async (resumeNodeId?: string | null) => {
        if (isRunning || nodes.length === 0) return;
        const startTime = performance.now();

        setIsRunning(true);
        if (!resumeNodeId) {
            clearLogs();
            clearTimeline();
            nodes.forEach(n => updateNodeStatus(n.id, 'idle'));
        }

        // Topological sort 
        const adj_fixed: Record<string, string[]> = {};
        const inDeg_fixed: Record<string, number> = {};
        nodes.forEach(n => { adj_fixed[n.id] = []; inDeg_fixed[n.id] = 0; });

        edges.forEach(e => {
            if (adj_fixed[e.source]) adj_fixed[e.source].push(e.target);
            if (e.target in inDeg_fixed) inDeg_fixed[e.target]++;
        });

        let queue = nodes.filter(n => inDeg_fixed[n.id] === 0).map(n => n.id);

        while (queue.length > 0) {
            const currentBatch = [...queue];
            queue = [];

            await Promise.all(currentBatch.map(async (nodeId) => {
                const node = nodes.find(n => n.id === nodeId)!;

                // Debugger Logic
                const s = useFlowStore.getState();
                if (s.isDebugMode) {
                    useFlowStore.setState({ isPaused: true, currentDebugNodeId: nodeId });
                    while (useFlowStore.getState().isPaused && useFlowStore.getState().isDebugMode) {
                        await new Promise(r => setTimeout(r, 100));
                    }
                    if (!useFlowStore.getState().isDebugMode) {
                        useFlowStore.setState({ currentDebugNodeId: null });
                        return;
                    }
                }

                const nodeInStore = useFlowStore.getState().nodes.find(n => n.id === nodeId);
                if (nodeInStore?.data.status === 'skipped' || (resumeNodeId && nodeInStore?.data.status === 'success' && nodeId !== resumeNodeId)) {
                    for (const neighbor of adj_fixed[nodeId]) {
                        inDeg_fixed[neighbor]--;
                        if (inDeg_fixed[neighbor] === 0) queue.push(neighbor);
                    }
                    return;
                }

                updateNodeStatus(nodeId, 'running');
                startNodeExecution(nodeId, node.data.label, node.data.nodeType);

                // ── The core execution promise that retryWithPolicy will run ──
                const executionAttempt = async () => {
                    const cfg = node.data.config as Record<string, any>;
                    let lastMetrics = { maxCpu: 0, maxMemory: 0 };
                    let nodeSuccess = false;

                    const { getExecutionHandler } = await import('../lib/nodeRegistry.ts');
                    const handler = getExecutionHandler(node.data.nodeType);

                    if (typeof handler === 'function') {
                        const result = await handler(cfg, { projectPath, nodeId });
                        lastMetrics = result.metrics || lastMetrics;
                        if (!result.success) throw new Error(result.error || 'Plugin node failed');
                        nodeSuccess = true;
                    } else if (node.data.nodeType === 'delayNode') {
                        const secs = Number(cfg.seconds) || 5;
                        await new Promise(r => setTimeout(r, secs * 1000));
                        nodeSuccess = true;
                    } else {
                        // Build shell command
                        let command = '';
                        const envVars: Record<string, string> = {};

                        // Inject env vars and resolve secrets
                        if (cfg.envVars && typeof cfg.envVars === 'object') {
                            for (const [k, v] of Object.entries(cfg.envVars)) {
                                if (k && typeof v === 'string') {
                                    if (v.startsWith('$SECRET_')) {
                                        const secretKey = v.replace('$SECRET_', '');
                                        try {
                                            const secretVal = await invoke<string | null>('get_secret', { key: secretKey });
                                            if (secretVal) envVars[k] = secretVal;
                                            else throw new Error(`Secret ${secretKey} not found in OS keychain`);
                                        } catch (err) {
                                            throw new Error(`Failed to inject secret ${secretKey}: ${err}`);
                                        }
                                    } else {
                                        envVars[k] = String(v);
                                    }
                                }
                            }
                        }

                        switch (node.data.nodeType) {
                            case 'gitPull':
                                command = `git -C "${cfg.directory || projectPath || '.'}" pull ${cfg.remote || 'origin'} ${cfg.branch || 'main'}`;
                                break;
                            case 'dockerBuild':
                                command = `docker build -t ${cfg.tag || 'myapp:latest'} ${cfg.context || '.'}`;
                                break;
                            case 'dockerRun':
                                command = `docker run ${cfg.detach ? '-d' : ''} ${cfg.remove ? '--rm' : ''} -p ${cfg.ports || '3000:3000'} ${cfg.image || 'myapp:latest'}`.replace(/\s+/g, ' ').trim();
                                break;
                            case 'dockerCompose':
                                command = `docker compose -f "${cfg.file || 'docker-compose.yml'}" ${cfg.action || 'up'}${cfg.detach ? ' -d' : ''}`;
                                break;
                            case 'scriptRun':
                                command = String(cfg.command || '');
                                break;
                            case 'npmRun': {
                                const dir = cfg.packageDir ? `--prefix "${cfg.packageDir}"` : '';
                                command = `npm run ${cfg.script || 'build'} ${dir}`.trim();
                                break;
                            }
                            case 'pipInstall':
                                if (cfg.venv) {
                                    command = `python -m venv "${cfg.venvDir || '.venv'}" && "${cfg.venvDir || '.venv'}/bin/pip" install -r "${cfg.requirements || 'requirements.txt'}"`;
                                } else {
                                    command = `pip install -r "${cfg.requirements || 'requirements.txt'}"`;
                                }
                                break;
                            case 'makeTarget':
                                command = `make -j${cfg.jobs || 4} ${cfg.target || 'build'}`;
                                break;
                            case 'kubectlApply':
                                command = `kubectl apply -f "${cfg.manifest || 'k8s/'}" -n "${cfg.namespace || 'default'}"${cfg.dryRun ? ' --dry-run=client' : ''}`;
                                break;
                            case 'testRunner':
                                switch (String(cfg.framework)) {
                                    case 'pytest': command = `pytest ${cfg.pattern || ''} ${cfg.coverage ? '--cov' : ''}`.trim(); break;
                                    case 'go test': command = 'go test ./...'; break;
                                    case 'cargo test': command = 'cargo test'; break;
                                    case 'vitest': command = 'npx vitest run'; break;
                                    default: command = `npx ${cfg.framework || 'jest'} ${cfg.pattern || ''} ${cfg.coverage ? '--coverage' : ''}`.trim();
                                }
                                break;
                            case 'notification':
                                addLog({ nodeId, nodeLabel: node.data.label, level: 'info', message: `🔔 ${cfg.title}: ${cfg.message}` });
                                nodeSuccess = true;
                                break;
                        }

                        if (command) {
                            const result = await invoke<any>('execute_command', {
                                nodeId, command, cwd: projectPath, envVars: Object.keys(envVars).length > 0 ? envVars : null,
                                timeout_seconds: cfg.executionProfile?.timeoutSeconds ?? 300,
                                profile: cfg.executionProfile?.profile ?? 'native',
                                docker_config: cfg.executionProfile?.profile === 'docker' ? {
                                    image: cfg.executionProfile.dockerImage,
                                    cpu_limit: cfg.executionProfile.cpuLimit,
                                    mem_limit: cfg.executionProfile.memLimit
                                } : undefined,
                                ssh_config: cfg.executionProfile?.profile === 'ssh' ? {
                                    host: cfg.executionProfile.sshHost,
                                    user: cfg.executionProfile.sshUser
                                } : undefined
                            });

                            if (result.stdout) {
                                result.stdout.split('\n').filter(Boolean).forEach((line: string) =>
                                    addLog({ nodeId, nodeLabel: node.data.label, level: 'stdout', message: line })
                                );
                            }
                            if (result.stderr) {
                                result.stderr.split('\n').filter(Boolean).forEach((line: string) =>
                                    addLog({ nodeId, nodeLabel: node.data.label, level: 'stderr', message: line })
                                );
                            }

                            lastMetrics = { maxCpu: result.max_cpu, maxMemory: result.max_memory_mb };

                            if (result.exit_code !== 0) {
                                const errorReason = result.timed_out ? 'Command timed out' : `Exit code ${result.exit_code}`;
                                throw new Error(`${errorReason}\n${result.stderr || result.stdout}`);
                            }
                            nodeSuccess = true;
                        }
                    }

                    if (!nodeSuccess) throw new Error("Execution failed");
                    return { nodeSuccess, lastMetrics };
                };

                // ── Run with Retry Policy ──
                const policy = (node.data.config.retryPolicy as any) || DEFAULT_RETRY_POLICY;

                const result = await retryWithPolicy(
                    executionAttempt,
                    policy,
                    { nodeId, nodeLabel: node.data.label },
                    (attempt) => {
                        const msg = attempt > 1 ? `Retry attempt ${attempt}...` : `Starting ${node.data.label}...`;
                        addLog({ nodeId, nodeLabel: node.data.label, level: 'info', message: msg });

                        // Wait for manual confirmation if needed
                        if (attempt > 1 && policy.strategy === 'manual') {
                            toast.loading(
                                (t) => (
                                    <span className="flex items-center gap-2" >
                                        {node.data.label} failed.
                                        < button onClick={() => { toast.dismiss(t.id); (window as any)[`__retry_${nodeId}`] = true; }
                                        }
                                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs ml-2" > Retry Now </button>
                                        < button onClick={() => { toast.dismiss(t.id); (window as any)[`__retry_${nodeId}_cancel`] = true; }}
                                            className="bg-gray-600 text-white px-2 py-1 rounded text-xs" > Cancel </button>
                                    </span>
                                ),
                                { id: `manual_retry_${nodeId}`, duration: Infinity }
                            );

                            // Return a promise that resolves when user clicks
                            return waitForCondition(() => {
                                if ((window as any)[`__retry_${nodeId}`]) {
                                    delete (window as any)[`__retry_${nodeId}`];
                                    return true;
                                }
                                if ((window as any)[`__retry_${nodeId}_cancel`]) {
                                    delete (window as any)[`__retry_${nodeId}_cancel`];
                                    throw new Error("Manual retry cancelled");
                                }
                                return false;
                            });
                        }
                    }
                );

                if (result.success && result.data?.nodeSuccess) {
                    updateNodeStatus(nodeId, 'success');
                    finishNodeExecution(nodeId, 'success', result.data.lastMetrics);
                    metricService.log('node_execution', performance.now() - startTime, {
                        nodeType: node.data.nodeType,
                        status: 'success',
                        nodeId: nodeId,
                        maxCpu: result.data.lastMetrics.maxCpu,
                        maxMemory: result.data.lastMetrics.maxMemory
                    });
                } else {
                    const errorMsg = result.error?.message || 'Execution failed';
                    updateNodeStatus(nodeId, 'error');
                    finishNodeExecution(nodeId, 'error', undefined);
                    setCheckpoint(nodeId);

                    toast.error(`${node.data.label} failed: ${errorMsg}`, { id: nodeId });

                    // Skip dependents
                    const skip = (id: string) => {
                        const currentStatus = useFlowStore.getState().nodes.find(n => n.id === id)?.data.status;
                        if (currentStatus === 'idle' || currentStatus === 'running') {
                            updateNodeStatus(id, 'skipped');
                            finishNodeExecution(id, 'skipped');
                            adj_fixed[id]?.forEach(skip);
                        }
                    };
                    adj_fixed[nodeId].forEach(skip);
                    return;
                }

                for (const neighbor of adj_fixed[nodeId]) {
                    inDeg_fixed[neighbor]--;
                    if (inDeg_fixed[neighbor] === 0) queue.push(neighbor);
                }
            }));
        }

        const elapsed = performance.now() - startTime;
        metricService.log('execution', elapsed, { nodeCount: nodes.length });

        const allDone = useFlowStore.getState().nodes.every(n => n.data.status === 'success' || n.data.status === 'skipped');
        const anyFailed = useFlowStore.getState().nodes.some(n => n.data.status === 'error');
        if (allDone) setCheckpoint(null);
        setIsRunning(false);

        // Flow-complete desktop notification
        if (allDone && !anyFailed) {
            toast.success(`✅ Flow completed in ${(elapsed / 1000).toFixed(1)}s`, { duration: 5000, icon: '🎉' });
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('DevFlow Studio', { body: `Flow completed in ${(elapsed / 1000).toFixed(1)}s` });
            }
        } else if (anyFailed) {
            toast.error('❌ Flow failed — check the logs', { duration: 6000 });
        }
    }, [nodes, edges, isRunning, setIsRunning, addLog, updateNodeStatus, clearLogs, startNodeExecution, finishNodeExecution, clearTimeline, setCheckpoint, projectPath]);

    return { runFlow, isRunning };
}
