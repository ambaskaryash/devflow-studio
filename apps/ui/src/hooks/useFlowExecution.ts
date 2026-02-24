// ============================================================
// DevFlow Studio — Flow Execution Hook (Phase 3)
// Shared logic for running, retrying, and resuming flows.
// ============================================================

import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useFlowStore } from '../store/flowStore.ts';
import { useProjectStore } from '../store/projectStore.ts';
import { safeExecute } from '../lib/SafeExecutor.ts';
import { toast } from 'react-hot-toast';
import { metricService } from '../lib/metricService.ts';

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

                // Phase 4: Debugger Pause Logic
                const s = useFlowStore.getState();
                if (s.isDebugMode) {
                    useFlowStore.setState({ isPaused: true, currentDebugNodeId: nodeId });
                    // Wait until isPaused becomes false
                    while (useFlowStore.getState().isPaused && useFlowStore.getState().isDebugMode) {
                        await new Promise(r => setTimeout(r, 100));
                    }
                    // Reset current debug node if we stopped debugging
                    if (!useFlowStore.getState().isDebugMode) {
                        useFlowStore.setState({ currentDebugNodeId: null });
                        return;
                    }
                }

                const nodeInStore = useFlowStore.getState().nodes.find(n => n.id === nodeId);
                if (nodeInStore?.data.status === 'skipped' || (resumeNodeId && nodeInStore?.data.status === 'success' && nodeId !== resumeNodeId)) {
                    // Decrement neighbors for skipped/already success
                    for (const neighbor of adj_fixed[nodeId]) {
                        inDeg_fixed[neighbor]--;
                        if (inDeg_fixed[neighbor] === 0) queue.push(neighbor);
                    }
                    return;
                }

                updateNodeStatus(nodeId, 'running');
                startNodeExecution(nodeId, node.data.label, node.data.nodeType);
                addLog({ nodeId, nodeLabel: node.data.label, level: 'info', message: `Starting ${node.data.label}...` });

                // Wrapped execution logic
                const executionPromise = async () => {
                    const cfg = node.data.config;
                    let lastMetrics = { maxCpu: 0, maxMemory: 0 };
                    let nodeSuccess = false;

                    const { getExecutionHandler } = await import('../lib/nodeRegistry.ts');
                    const handler = getExecutionHandler(node.data.nodeType);

                    if (typeof handler === 'function') {
                        const result = await handler(cfg, { projectPath, nodeId });
                        nodeSuccess = result.success;
                        lastMetrics = result.metrics || lastMetrics;
                    } else if (node.data.nodeType === 'delayNode') {
                        const secs = Number(cfg.seconds) || 5;
                        await new Promise(r => setTimeout(r, secs * 1000));
                        nodeSuccess = true;
                    } else {
                        // ── Build command from node type ─────────────────────────────────
                        let command = '';
                        const envVars: Record<string, string> = {};

                        // Collect env vars from node config
                        if (cfg.envVars && typeof cfg.envVars === 'object') {
                            for (const [k, v] of Object.entries(cfg.envVars)) {
                                if (k && v) envVars[k] = String(v);
                            }
                        }

                        switch (node.data.nodeType) {
                            case 'gitPull':
                                command = `git -C "${cfg.directory || projectPath || '.'}" pull ${cfg.remote || 'origin'} ${cfg.branch || 'main'}`;
                                break;
                            case 'dockerBuild':
                                command = `docker build -t "${cfg.tag || 'myapp:latest'}" -f "${cfg.dockerfile || 'Dockerfile'}" "${cfg.context || '.'}"'`;
                                command = `docker build -t "${cfg.tag || 'myapp:latest'}" "${cfg.context || '.'}"'`;
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
                                nodeId, command, cwd: projectPath, envVars: Object.keys(envVars).length > 0 ? envVars : null
                            });

                            // Pipe collected output into the log panel
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
                            nodeSuccess = result.exit_code === 0;
                        } else if (!nodeSuccess) {
                            // Already handled by notification type or unknown
                            nodeSuccess = true;
                        }
                    }
                    return { nodeSuccess, lastMetrics };
                };

                const result = await safeExecute(executionPromise, `Node(${node.data.label})`);

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
                    const errorMsg = result.error || 'Execution failed';
                    updateNodeStatus(nodeId, 'error');
                    finishNodeExecution(nodeId, 'error', result.data?.lastMetrics);
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
