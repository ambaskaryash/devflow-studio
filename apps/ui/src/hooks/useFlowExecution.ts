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
                        // Standard Run
                        let command = '';
                        if (node.data.nodeType === 'dockerBuild') command = `docker build -t ${cfg.tag} ${cfg.context}`;
                        else if (node.data.nodeType === 'dockerRun') command = `docker run ${cfg.image}`;
                        else if (node.data.nodeType === 'gitPull') command = `git pull ${cfg.remote} ${cfg.branch}`;
                        else if (node.data.nodeType === 'scriptRun') command = cfg.command as string;

                        if (command) {
                            const result = await invoke<any>('execute_command', {
                                nodeId, command, cwd: projectPath
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
                        } else {
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
        if (allDone) setCheckpoint(null);
        setIsRunning(false);
    }, [nodes, edges, isRunning, setIsRunning, addLog, updateNodeStatus, clearLogs, startNodeExecution, finishNodeExecution, clearTimeline, setCheckpoint, projectPath]);

    return { runFlow, isRunning };
}
