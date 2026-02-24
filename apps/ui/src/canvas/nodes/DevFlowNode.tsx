// ============================================================
// DevFlow Studio — DevFlowNode (Registry-Driven)  v2.0
// All visual properties come from NodeRegistry — no hard-coded maps.
// ============================================================

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { DevFlowNodeData, NodeStatus } from '../../store/flowStore.ts';
import { getNodeDef } from '../../lib/nodeRegistry.ts';

const STATUS_BADGE: Record<NodeStatus, { text: string; cls: string }> = {
    idle: { text: 'idle', cls: 'bg-gray-700 text-gray-400' },
    running: { text: 'running', cls: 'bg-amber-500/20 text-amber-400 animate-pulse' },
    success: { text: 'done', cls: 'bg-green-500/20 text-green-400' },
    error: { text: 'error', cls: 'bg-red-500/20 text-red-400' },
    skipped: { text: 'skipped', cls: 'bg-gray-600/20 text-gray-500' },
};

function DevFlowNodeInner({ data, selected }: NodeProps<DevFlowNodeData>) {
    const def = getNodeDef(data.nodeType);
    const badge = STATUS_BADGE[data.status] ?? STATUS_BADGE.idle;

    // Fallback if type not in registry (e.g. future marketplace plugin not yet loaded)
    const icon = def?.icon ?? '🔌';
    const colorClass = def?.colorClass ?? 'from-gray-600/20 to-gray-800/10 border-gray-600/40';
    const headerBg = def?.headerBgClass ?? 'bg-gray-600/30';

    return (
        <div className={`
            relative rounded-xl border bg-gradient-to-br ${colorClass}
            backdrop-blur-sm w-52 transition-all duration-150 select-none
            ${selected ? 'ring-2 ring-blue-500/70 ring-offset-1 ring-offset-transparent shadow-lg shadow-blue-500/20' : ''}
            ${data.status === 'running' ? 'shadow-md shadow-amber-500/20' : ''}
            ${data.status === 'error' ? 'shadow-md shadow-red-500/20' : ''}
        `}>
            {/* Active Execution Ring (SVG) */}
            {data.status === 'running' && (
                <div className="absolute -inset-[2px] rounded-[14px] overflow-hidden pointer-events-none z-0">
                    <svg className="w-full h-full rotate-[-90deg]">
                        <circle
                            cx="50%"
                            cy="50%"
                            r="48%"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-amber-500/40"
                            strokeDasharray="250"
                            strokeDashoffset="250"
                        >
                            <animate
                                attributeName="stroke-dashoffset"
                                from="250"
                                to="0"
                                dur="3s"
                                repeatCount="indefinite"
                            />
                        </circle>
                    </svg>
                </div>
            )}

            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !border-2 !border-gray-500 !bg-canvas-bg hover:!border-blue-400 transition-colors z-10"
            />

            {/* Header */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl z-10 relative ${headerBg}`}>
                <span className="text-base leading-none">{icon}</span>
                <span className="text-xs font-semibold text-white tracking-wide truncate flex-1">
                    {data.label}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter ${badge.cls}`}>
                    {badge.text}
                </span>
            </div>

            {/* Config preview */}
            <div className="px-3 py-2 space-y-0.5 relative z-10">
                {def?.configSchema.slice(0, 2).map(field => {
                    const val = data.config[field.key];
                    if (val === undefined || val === '' || val === null) return null;
                    const display = Array.isArray(val)
                        ? (val as string[]).join(', ')
                        : String(val);
                    return (
                        <div key={field.key} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <span className="text-gray-600 shrink-0">{field.label}:</span>
                            <span className="text-gray-400 font-mono truncate">{display}</span>
                        </div>
                    );
                })}
            </div>

            {/* Clean Footer */}
            <div className="h-1.5 rounded-b-xl" />

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !border-2 !border-gray-500 !bg-canvas-bg hover:!border-blue-400 transition-colors z-10"
            />
        </div>
    );
}

export const DevFlowNode = memo(DevFlowNodeInner);
