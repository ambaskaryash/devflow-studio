// ============================================================
// DevFlow Studio — Flow Canvas
// React Flow canvas with custom nodes, controls, minimap
// ============================================================

import { useCallback } from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    ReactFlowProvider,
    type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFlowStore } from '../store/flowStore.ts';
import { DevFlowNode } from './nodes/DevFlowNode.tsx';
import type { DevFlowNodeData } from '../store/flowStore.ts';
import type { Node } from 'reactflow';
import { getNodeDef } from '../lib/nodeRegistry.ts';

const nodeTypes: NodeTypes = {
    devflowNode: DevFlowNode,
};

const miniMapNodeColor = (node: Node<DevFlowNodeData>) => {
    const def = getNodeDef(node.data?.nodeType);
    if (!def) return '#6b7280';

    // Extract color from Tailwind classes (e.g., 'blue-600')
    const match = def.colorClass.match(/(blue|green|amber|orange|purple|red|gray|indigo)-[0-9]+/);
    const colorName = match ? match[0].split('-')[0] : 'blue';

    const hexMap: Record<string, string> = {
        blue: '#2563eb',
        green: '#16a34a',
        amber: '#d97706',
        orange: '#ea580c',
        purple: '#7c3aed',
        red: '#dc2626',
        gray: '#6b7280',
        indigo: '#4f46e5'
    };

    return hexMap[colorName] || '#3b82f6';
};

function FlowCanvasInner() {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNode } = useFlowStore();

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, [setSelectedNode]);

    const onNodeClick = useCallback((_: any, node: any) => {
        setSelectedNode(node.id);
    }, [setSelectedNode]);

    return (
        <div className="flex-1 relative bg-canvas-bg overflow-hidden">
            {nodes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 gap-4">
                    <div className="text-5xl opacity-30">⚡</div>
                    <p className="text-gray-600 text-base font-medium">Start building your workflow</p>
                    <p className="text-gray-700 text-sm">Add nodes from the toolbar above</p>
                </div>
            )}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onPaneClick={onPaneClick}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                defaultEdgeOptions={{
                    animated: false,
                    style: { stroke: '#3b82f6', strokeWidth: 2 },
                }}
                proOptions={{ hideAttribution: true }}
                className="bg-canvas-bg"
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1.5}
                    color="#21262d"
                />
                <Controls
                    className="!bg-canvas-surface !border-canvas-border"
                    showInteractive={false}
                />
                <MiniMap
                    nodeColor={miniMapNodeColor}
                    maskColor="rgba(0,0,0,0.6)"
                    style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8 }}
                />
            </ReactFlow>
        </div>
    );
}

export function FlowCanvas() {
    return (
        <ReactFlowProvider>
            <FlowCanvasInner />
        </ReactFlowProvider>
    );
}
