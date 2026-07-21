import React, { useState } from "react";
import { Play, Pause, Plus, Volume2, VolumeX, ZoomIn, ZoomOut, Maximize2, ListTodo, Bot, Network, Code2, Cpu } from "lucide-react";

interface SidebarProps {
  connected: boolean;
  simRunning: boolean;
  onToggleSim: () => void;
  onSpawnAgent: (role: string, name: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
  onToggleAudio: () => boolean;
  onOpenTaskModal: () => void;
  onOpenNetworkGraph: () => void;
  onOpenCodeArtifacts: () => void;
  activeAgentsCount: number;
}

const ROLES = [
  { role: "architect", label: "Architect", color: "bg-purple-500" },
  { role: "executor", label: "Developer", color: "bg-green-500" },
  { role: "designer", label: "Designer", color: "bg-blue-500" },
  { role: "planner", label: "Planner", color: "bg-amber-500" },
  { role: "critic", label: "Reviewer", color: "bg-red-500" },
  { role: "tester", label: "QA Tester", color: "bg-orange-500" },
  { role: "oracle", label: "AI Oracle", color: "bg-violet-500" },
  { role: "librarian", label: "Librarian", color: "bg-cyan-500" }
];

export const Sidebar: React.FC<SidebarProps> = ({
  connected,
  simRunning,
  onToggleSim,
  onSpawnAgent,
  onZoomIn,
  onZoomOut,
  onResetCamera,
  onToggleAudio,
  onOpenTaskModal,
  onOpenNetworkGraph,
  onOpenCodeArtifacts,
  activeAgentsCount
}) => {
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("executor");
  const [agentName, setAgentName] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [provider, setProvider] = useState("mock");

  const handleSpawnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSpawnAgent(selectedRole, agentName || `${selectedRole.toUpperCase()}_bot`);
    setAgentName("");
    setShowSpawnModal(false);
  };

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
      {/* Brand Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-3 rounded-xl shadow-2xl flex items-center gap-3 text-white">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/30">
          🐝
        </div>
        <div>
          <h1 className="font-extrabold text-sm tracking-wide text-slate-100 flex items-center gap-2">
            SwarmVille <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">v2.1</span>
          </h1>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
            {connected ? "WebSocket Connected" : "Disconnected"}
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-2 rounded-xl shadow-2xl flex items-center gap-2">
        <button
          onClick={onToggleSim}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            simRunning
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
          }`}
          title={simRunning ? "Pause Swarm Simulation" : "Start Swarm Simulation"}
        >
          {simRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {simRunning ? "Pause Sim" : "Run Sim"}
        </button>

        <button
          onClick={() => setShowSpawnModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/30"
        >
          <Plus className="w-3.5 h-3.5" /> Spawn
        </button>

        <button
          onClick={onOpenTaskModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition"
        >
          <ListTodo className="w-3.5 h-3.5" /> Tasks
        </button>

        <button
          onClick={onOpenNetworkGraph}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition"
          title="Swarm Topology Graph"
        >
          <Network className="w-3.5 h-3.5" /> Graph
        </button>

        <button
          onClick={onOpenCodeArtifacts}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition"
          title="Generated Code Artifacts"
        >
          <Code2 className="w-3.5 h-3.5" /> Code
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Viewport & Audio Controls */}
        <button onClick={onZoomIn} className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={onZoomOut} className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={onResetCamera} className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition" title="Reset View">
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setAudioEnabled(onToggleAudio())}
          className={`p-1.5 rounded-lg transition ${audioEnabled ? "text-indigo-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-800"}`}
          title="Toggle SFX"
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Provider Selector & Active Agent Count */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-400 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
          >
            <option value="mock">Provider: Mock Simulator</option>
            <option value="ollama">Provider: Ollama (Local)</option>
            <option value="claude">Provider: Claude Code</option>
            <option value="openai">Provider: OpenAI GPT-4</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-slate-200">{activeAgentsCount} Agents</span>
        </div>
      </div>

      {/* Spawn Modal */}
      {showSpawnModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-white">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Spawn New AI Agent
            </h2>
            <form onSubmit={handleSpawnSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Agent Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cypher_01"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Role Expertise</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r.role}
                      onClick={() => setSelectedRole(r.role)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-medium transition ${
                        selectedRole === r.role
                          ? "border-indigo-500 bg-indigo-500/20 text-white"
                          : "border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSpawnModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30"
                >
                  Confirm & Spawn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
