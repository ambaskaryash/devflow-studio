import { describe, it, expect } from 'vitest';
import { exportGitHubActions } from '../ciExporters.ts';
import type { Node, Edge } from 'reactflow';
import type { DevFlowNodeData } from '../../store/flowStore.ts';

describe('CI Exporters', () => {
    it('generates GitHub Actions YAML with correct needs array', () => {
        const nodes: Node<DevFlowNodeData>[] = [
            { id: '1', type: 'devflowNode', data: { label: 'git-pull', nodeType: 'gitPull', status: 'idle', config: {} }, position: { x: 0, y: 0 } },
            { id: '2', type: 'devflowNode', data: { label: 'docker-build', nodeType: 'dockerBuild', status: 'idle', config: {} }, position: { x: 100, y: 100 } }
        ];
        const edges: Edge[] = [
            { id: 'e1-2', source: '1', target: '2' }
        ];

        const yaml = exportGitHubActions(nodes, edges, 'TestFlow');

        expect(yaml).toContain('name: TestFlow');
        expect(yaml).toContain('git-pull:');
        expect(yaml).toContain('docker-build:');
        expect(yaml).toContain('needs: ["git-pull"]');
    });
});
