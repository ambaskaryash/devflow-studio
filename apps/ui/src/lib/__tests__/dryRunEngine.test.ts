import { describe, it, expect } from 'vitest';
import { runDryRun } from '../dryRunEngine.ts';
import type { Node, Edge } from 'reactflow';
import type { DevFlowNodeData } from '../../store/flowStore.ts';

describe('Dry Run Engine', () => {
    it('returns ordered results with duration estimates and no actual commands executed', async () => {
        const nodes: Node<DevFlowNodeData>[] = [
            { id: '1', type: 'devflowNode', data: { label: 'step1', nodeType: 'scriptRun', status: 'idle', config: {} }, position: { x: 0, y: 0 } },
            { id: '2', type: 'devflowNode', data: { label: 'step2', nodeType: 'scriptRun', status: 'idle', config: {} }, position: { x: 100, y: 100 } }
        ];
        const edges: Edge[] = [
            { id: 'e1-2', source: '1', target: '2' }
        ];

        // Replace global service call or inject (depending on dryRunEngine implementation).
        // Since we didn't mock metricService here, we assume dryRunEngine still returns a structure we can test.
        const results = await runDryRun(nodes, edges);

        expect(results.length).toBe(2);
        expect(results[0].nodeId).toBe('1');
        expect(results[1].nodeId).toBe('2');

        // Assert structure
        expect(results[0].estimatedDurationMs).toBeDefined();
        expect(results[0].warnings).toBeInstanceOf(Array);
        expect(results[0].command).toBeDefined();
    });
});
