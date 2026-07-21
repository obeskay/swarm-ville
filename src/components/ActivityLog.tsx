import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";

export interface LogItem {
  id: string;
  name?: string;
  role?: string;
  text: string;
  timestamp: number;
}

interface ActivityLogProps {
  logs: LogItem[];
}

const ROLE_COLORS: Record<string, string> = {
  architect: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  executor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  designer: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  planner: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  critic: "text-red-400 border-red-500/30 bg-red-500/10",
  tester: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  oracle: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  librarian: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
};

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const [collapsed, setCollapsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="absolute bottom-4 left-4 z-20 w-96 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden text-white transition-all duration-300">
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold tracking-wide">Swarm Activity Feed</h2>
          <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full font-semibold">
            {logs.length}
          </span>
        </div>
        <button className="text-slate-400 hover:text-white transition">
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Log Stream */}
      {!collapsed && (
        <div className="p-3 max-h-48 overflow-y-auto flex flex-col gap-2 font-mono text-[11px] scrollbar-thin scrollbar-thumb-slate-700">
          {logs.length === 0 ? (
            <div className="text-slate-500 text-center py-4 italic font-sans text-xs">
              Waiting for agent activity...
            </div>
          ) : (
            logs.map((item, index) => {
              const colorClass = item.role ? ROLE_COLORS[item.role] || "text-slate-300 bg-slate-800 border-slate-700" : "text-slate-300 bg-slate-800 border-slate-700";
              const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div key={index} className="flex gap-2 items-start bg-slate-800/40 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 mt-0.5">{timeStr}</span>
                  <div className="flex-1">
                    {item.name && (
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border mr-1.5 ${colorClass}`}>
                        {item.name}
                      </span>
                    )}
                    <span className="text-slate-200 leading-relaxed font-sans">{item.text}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
