import React, { useState } from "react";
import { X, Play, CheckCircle2, Clock, Sparkles } from "lucide-react";

export interface TaskItem {
  id: string;
  prompt: string;
  status: "in_progress" | "completed";
  progress: number;
  createdAt: string;
}

interface TaskModalProps {
  tasks: TaskItem[];
  onClose: () => void;
  onSubmitTask: (prompt: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ tasks, onClose, onSubmitTask }) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSubmitTask(prompt.trim());
    setPrompt("");
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-white flex flex-col gap-6 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Swarm Task Dispatcher</h2>
              <p className="text-xs text-slate-400">Submit coding objectives for multi-agent execution</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Submit Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Build responsive pricing table with dark mode and unit tests..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 placeholder-slate-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/30"
          >
            <Play className="w-3.5 h-3.5" /> Dispatch
          </button>
        </form>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active & Recent Objectives</h3>
          {tasks.length === 0 ? (
            <div className="text-slate-500 text-center py-8 text-xs italic">
              No tasks dispatched yet. Enter a prompt above to start the swarm collaboration!
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                    {task.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-cyan-400 animate-spin" />
                    )}
                    {task.prompt}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    task.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                  }`}>
                    {task.status === "completed" ? "Done" : `${task.progress}%`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      task.status === "completed" ? "bg-emerald-500" : "bg-cyan-400"
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
