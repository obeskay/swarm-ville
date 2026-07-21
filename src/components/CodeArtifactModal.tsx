import React, { useState } from "react";
import { X, Code2, Copy, Check, FileCode } from "lucide-react";

export interface CodeArtifact {
  filename: string;
  language: string;
  code: string;
}

const DEFAULT_ARTIFACTS: CodeArtifact[] = [
  {
    filename: "SwarmWidget.tsx",
    language: "typescript",
    code: `import React, { useState } from "react";\n\nexport const SwarmWidget = ({ agentCount }: { agentCount: number }) => {\n  const [active, setActive] = useState(true);\n  return (\n    <div className="p-4 bg-slate-900 text-white rounded-xl border border-indigo-500/30">\n      <h3 className="font-bold text-sm text-indigo-400">Swarm Telemetry</h3>\n      <p className="text-xs text-slate-300">Active AI Agents: {agentCount}</p>\n      <button onClick={() => setActive(!active)} className="mt-2 px-3 py-1 bg-indigo-600 rounded text-xs">\n        {active ? "Pause Stream" : "Resume Stream"}\n      </button>\n    </div>\n  );\n};`
  },
  {
    filename: "api/swarm.ts",
    language: "typescript",
    code: `export async function handleTaskDispatch(req: Request) {\n  const { prompt } = await req.json();\n  console.log(\`[Swarm API] Dispatching prompt: "\${prompt}"\`);\n  return Response.json({ status: "dispatched", swarmId: "sw-" + Date.now() });\n}`
  },
  {
    filename: "tests/swarm.test.ts",
    language: "typescript",
    code: `import { expect, test } from "vitest";\n\ntest("agent swarm responds to WebSocket telemetry", () => {\n  const connected = true;\n  expect(connected).toBe(true);\n});`
  }
];

interface CodeArtifactModalProps {
  onClose: () => void;
}

export const CodeArtifactModal: React.FC<CodeArtifactModalProps> = ({ onClose }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const current = DEFAULT_ARTIFACTS[activeIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-white flex flex-col gap-4 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Generated Code Artifacts</h2>
              <p className="text-xs text-slate-400">Real-time source files built by SwarmVille agents</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          {DEFAULT_ARTIFACTS.map((art, i) => (
            <button
              key={art.filename}
              onClick={() => setActiveIdx(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                activeIdx === i
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-800/40 text-slate-400 border-slate-800 hover:border-slate-700"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              {art.filename}
            </button>
          ))}
        </div>

        {/* Code Content Box */}
        <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-96">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Code"}
          </button>
          <pre>{current.code}</pre>
        </div>
      </div>
    </div>
  );
};
