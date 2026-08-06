import { Check, Clipboard, Code2, Download, FileCode2 } from "lucide-react";
import { useState } from "react";
import type { Project } from "./shared";

interface Props { project: Project; onOpenWorkspace: () => void; }

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "release";

export const ReleaseCard = ({ project, onOpenWorkspace }: Props) => {
  const [copied, setCopied] = useState(false);
  const release = project.release;
  if (!release) return null;

  const summary = [
    `# ${project.name}`,
    `Kind: ${project.kind}`,
    `Objective: ${project.brief}`,
    "",
    "## Plan",
    release.plan,
    "",
    "## Build",
    release.build,
    "",
    "## Review",
    release.review,
    "",
    "## Verify",
    release.verify,
    "",
    "## Archive",
    release.archive
  ].join("\n");

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const downloadManifest = () => {
    const payload = JSON.stringify({
      product: { name: project.name, kind: project.kind, brief: project.brief },
      release
    }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(project.name)}-release.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <section className="release-card" aria-label="Shipped release artifact">
      <header className="release-card__head">
        <div><span className="release-card__icon"><FileCode2 size={13} /></span><span><strong>Release artifact</strong><small>Saved from the swarm run</small></span></div>
        <span className="release-card__status"><Check size={11} /> shipped</span>
      </header>
      <p>{release.archive || release.verify || "The release is ready for another iteration."}</p>
      <div className="release-card__meta"><span>Run {release.runId.slice(-8)}</span><span>{new Date(release.shippedAt).toLocaleDateString()}</span></div>
      <div className="release-card__actions">
        <button type="button" className="secondary release-card__studio" onClick={onOpenWorkspace}><Code2 size={12} /> Open Studio</button>
        <button type="button" className="secondary" onClick={() => void copySummary()}>{copied ? <Check size={12} /> : <Clipboard size={12} />} {copied ? "Copied" : "Copy brief"}</button>
        <button type="button" className="secondary" onClick={downloadManifest}><Download size={12} /> Export JSON</button>
      </div>
    </section>
  );
};
