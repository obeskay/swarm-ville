import React from "react";
import { X, Network, Cpu } from "lucide-react";
import { AgentData } from "../game/AgentSprite";

interface NetworkGraphProps {
  agents: AgentData[];
  onClose: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  architect: "#a855f7",
  executor: "#22c55e",
  designer: "#3b82f6",
  planner: "#f59e0b",
  critic: "#ef4444",
  tester: "#f97316",
  oracle: "#8b5cf6",
  librarian: "#06b6d4",
};

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ agents, onClose }) => {
  const width = 500;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 140;

  // Calculate circular positions for nodes
  const nodes = agents.map((agent, i) => {
    const angle = (i / Math.max(1, agents.length)) * 2 * Math.PI - Math.PI / 2;
    return {
      ...agent,
      cx: centerX + radius * Math.cos(angle),
      cy: centerY + radius * Math.sin(angle),
      color: ROLE_COLORS[agent.role] || "#6b7280"
    };
  });

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-white flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Swarm Communication Topology</h2>
              <p className="text-xs text-slate-400">Inter-agent message routing and collaboration graph</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SVG Graph View */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-center relative overflow-hidden">
          <svg width={width} height={height} className="overflow-visible">
            <defs>
              <filter id="glow-node">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Links connecting nodes */}
            {nodes.map((n1, i) =>
              nodes.slice(i + 1).map((n2, j) => (
                <line
                  key={`${i}-${j}`}
                  x1={n1.cx}
                  y1={n1.cy}
                  x2={n2.cx}
                  y2={n2.cy}
                  stroke={n1.color}
                  strokeWidth="1.5"
                  strokeOpacity="0.35"
                  strokeDasharray="4 2"
                />
              ))
            )}

            {/* Nodes */}
            {nodes.map((node) => (
              <g key={node.id} transform={`translate(${node.cx}, ${node.cy})`}>
                <circle r="18" fill="#0f172a" stroke={node.color} strokeWidth="2.5" filter="url(#glow-node)" />
                <text y="4" fontSize="10" textAnchor="middle" fill="#ffffff" fontWeight="bold">
                  {node.name.slice(0, 3).toUpperCase()}
                </text>
                <text y="30" fontSize="10" textAnchor="middle" fill={node.color} fontWeight="600">
                  {node.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-2 pt-1 border-t border-slate-800">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-purple-400" /> Active Nodes: {agents.length}
          </span>
          <span>Mesh Topology Connected</span>
        </div>
      </div>
    </div>
  );
};
