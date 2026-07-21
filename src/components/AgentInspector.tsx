import React, { useState } from "react";
import { X, Send, Trash2, Shield, Cpu, Sparkles, Brain } from "lucide-react";
import { AgentData } from "../game/AgentSprite";

interface AgentInspectorProps {
  agent: (AgentData & { memoryLogs?: string[] }) | null;
  onClose: () => void;
  onSendChat: (id: string, text: string) => void;
  onRemoveAgent: (id: string) => void;
}

const ROLE_THEMES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  architect: { label: "System Architect", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  executor: { label: "Lead Developer", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  designer: { label: "UI/UX Designer", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  planner: { label: "Product Planner", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  critic: { label: "Code Reviewer", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  tester: { label: "QA Specialist", bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  oracle: { label: "AI Oracle", bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
  librarian: { label: "Knowledge Curator", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
};

export const AgentInspector: React.FC<AgentInspectorProps> = ({
  agent,
  onClose,
  onSendChat,
  onRemoveAgent
}) => {
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState<"status" | "memory">("status");

  if (!agent) return null;

  const theme = ROLE_THEMES[agent.role] || { label: agent.role, bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(agent.id, chatInput.trim());
    setChatInput("");
  };

  return (
    <div className="absolute top-4 right-4 z-20 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl p-4 text-white flex flex-col gap-3 animate-in fade-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${theme.bg} ${theme.border} border`}>
            <Cpu className={`w-4 h-4 ${theme.text}`} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">{agent.name}</h2>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${theme.bg} ${theme.text} border ${theme.border}`}>
              {theme.label}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-2 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab("status")}
          className={`flex-1 py-1 text-center text-xs font-semibold rounded-lg transition ${
            activeTab === "status" ? "bg-slate-800 text-indigo-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3 h-3 inline mr-1" /> Activity
        </button>
        <button
          onClick={() => setActiveTab("memory")}
          className={`flex-1 py-1 text-center text-xs font-semibold rounded-lg transition ${
            activeTab === "memory" ? "bg-slate-800 text-purple-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Brain className="w-3 h-3 inline mr-1" /> Memory Vault
        </button>
      </div>

      {/* Tab 1: Current Activity */}
      {activeTab === "status" && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Current Action
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed italic">
            "{agent.status || "Standing by for task assignment..."}"
          </p>
        </div>
      )}

      {/* Tab 2: Memory Vault */}
      {activeTab === "memory" && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto font-mono text-[10px] text-slate-300 flex flex-col gap-1.5">
          {(!agent.memoryLogs || agent.memoryLogs.length === 0) ? (
            <span className="text-slate-500 italic">No short-term memories logged.</span>
          ) : (
            agent.memoryLogs.map((log, idx) => (
              <div key={idx} className="border-b border-slate-800/60 pb-1">
                <span className="text-purple-400 font-bold mr-1">›</span> {log}
              </div>
            ))
          )}
        </div>
      )}

      {/* Direct Speech Input */}
      <form onSubmit={handleSend} className="flex gap-2 mt-1">
        <input
          type="text"
          placeholder="Inject speech prompt..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/30"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Shield className="w-3 h-3 text-emerald-400" /> ID: {agent.id}
        </span>
        <button
          onClick={() => onRemoveAgent(agent.id)}
          className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] font-semibold hover:bg-red-500/10 px-2 py-1 rounded transition"
        >
          <Trash2 className="w-3 h-3" /> Dismiss Agent
        </button>
      </div>
    </div>
  );
};
