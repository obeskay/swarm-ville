import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BookOpen,
  Bot,
  Compass,
  Copy,
  Droplets,
  Eye,
  FileCode,
  FlaskConical,
  Footprints,
  Layers,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Scroll,
  ShoppingBag,
  Sprout,
  Store,
  Terminal,
  Trash2,
  Wheat,
  Zap
} from "lucide-react";
import type {
  Agent,
  AgentId,
  AgentState,
  GameProfile,
  Project,
  WorldContextMenuEvent
} from "../types";

interface Props {
  menu: WorldContextMenuEvent | null;
  agents: Agent[];
  agentStates: Record<string, AgentState>;
  projects: Project[];
  profile: GameProfile;
  running: boolean;
  activeProjectId: string | null;
  queuedProjectIds: string[];
  inCall: boolean;
  onClose: () => void;
  onSelectAgent: (id: AgentId) => void;
  onWalkTo: (worldX: number, worldZ: number) => void;
  onFocusAgent: (id: AgentId) => void;
  onFocusProject: (id: string) => void;
  onSelectProject: (id: string) => void;
  onWorkProject: (project: Project) => void;
  onTendProject: (project: Project) => void;
  onFertilizeProject: (project: Project) => void;
  onHarvestProject: () => void;
  onOpenWorkspace: (projectId: string) => void;
  onRemoveProject: (projectId: string) => void;
  onOpenLibrary: () => void;
  onOpenQuests: () => void;
  onOpenMarket: () => void;
  onOpenMemory: () => void;
  onOpenNewProject: () => void;
  onToggleCall: () => void;
  onBuyMarketItem: (item: "energy" | "fertilizer" | "plot") => void;
  onResetView: () => void;
  onCopyText: (text: string, label: string) => void;
  onPrefillGoal: (prompt: string) => void;
}

export const ContextMenu = ({
  menu,
  agents,
  agentStates,
  projects,
  profile,
  running,
  activeProjectId,
  queuedProjectIds,
  inCall,
  onClose,
  onSelectAgent,
  onWalkTo,
  onFocusAgent,
  onFocusProject,
  onSelectProject,
  onWorkProject,
  onTendProject,
  onFertilizeProject,
  onHarvestProject,
  onOpenWorkspace,
  onRemoveProject,
  onOpenLibrary,
  onOpenQuests,
  onOpenMarket,
  onOpenMemory,
  onOpenNewProject,
  onToggleCall,
  onBuyMarketItem,
  onResetView,
  onCopyText,
  onPrefillGoal
}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Position and clamp within viewport boundaries
  useLayoutEffect(() => {
    if (!menu) return;
    const padding = 12;
    const initialX = menu.screenX;
    const initialY = menu.screenY;
    const width = menuRef.current?.offsetWidth || 240;
    const height = menuRef.current?.offsetHeight || 300;

    const clampedX = Math.max(
      padding,
      Math.min(initialX, window.innerWidth - width - padding)
    );
    const clampedY = Math.max(
      padding,
      Math.min(initialY, window.innerHeight - height - padding)
    );

    setPosition({ x: clampedX, y: clampedY });
    setFocusedIndex(0);
  }, [menu]);

  // Global listeners for clean frictionless dismissal
  useEffect(() => {
    if (!menu) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
      if (!buttons || buttons.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % buttons.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + buttons.length) % buttons.length);
      } else if (event.key === "Enter" && focusedIndex >= 0 && buttons[focusedIndex]) {
        event.preventDefault();
        buttons[focusedIndex].click();
      }
    };

    const handleWindowBlur = () => onClose();

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [menu, onClose, focusedIndex]);

  // Sync keyboard focus to active button
  useEffect(() => {
    if (focusedIndex < 0 || !menuRef.current) return;
    const buttons = menuRef.current.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    if (buttons[focusedIndex]) {
      buttons[focusedIndex].focus();
    }
  }, [focusedIndex]);

  if (!menu) return null;

  const { target, worldX, worldZ } = menu;

  const renderAgentMenu = (agentId: AgentId) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return null;
    const state = agentStates[agentId] ?? "idle";

    return (
      <>
        <header className="context-menu__head">
          <div className="context-menu__icon-badge" style={{ background: agent.accent }}>
            <Bot size={13} color="#16140f" />
          </div>
          <div className="context-menu__title-group">
            <strong>{agent.name}</strong>
            <small>
              {agent.role} · <em className={`status-dot status-dot--${state}`}>{state}</em>
            </small>
          </div>
        </header>

        <div className="context-menu__divider" />

        <div className="context-menu__actions">
          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onSelectAgent(agent.id);
              onFocusAgent(agent.id);
              onClose();
            }}
          >
            <Eye size={13} />
            <span>Inspect {agent.name}</span>
            <kbd className="context-menu__shortcut">I</kbd>
          </button>

          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onWalkTo(worldX, worldZ);
              onClose();
            }}
          >
            <Footprints size={13} />
            <span>Walk over to {agent.name}</span>
            <kbd className="context-menu__shortcut">W</kbd>
          </button>

          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onPrefillGoal(`Ask ${agent.name} (${agent.role}): `);
              onClose();
            }}
          >
            <Terminal size={13} />
            <span>Assign task to {agent.name}</span>
          </button>

          {agent.id === "archivist" ? (
            <button
              type="button"
              className="context-menu__item"
              onClick={() => {
                onOpenMemory();
                onClose();
              }}
            >
              <BookOpen size={13} />
              <span>Village Archive & Memory</span>
            </button>
          ) : (
            <button
              type="button"
              className="context-menu__item"
              onClick={() => {
                onCopyText(`${agent.name} (${agent.role})`, "Agent profile copied");
                onClose();
              }}
            >
              <Copy size={13} />
              <span>Copy agent profile</span>
            </button>
          )}
        </div>
      </>
    );
  };

  const renderPlotMenu = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return null;

    const isQueued = queuedProjectIds.includes(project.id);
    const isWorking = activeProjectId === project.id;
    const canHarvest = Boolean(project.readyToHarvest);
    const energy = profile.energy ?? 0;
    const fertilizer = profile.fertilizer ?? 0;
    const canTend =
      !running &&
      !isWorking &&
      !isQueued &&
      !canHarvest &&
      project.progress < 96 &&
      energy > 0;
    const canFertilize =
      !running &&
      !isWorking &&
      !isQueued &&
      !canHarvest &&
      project.progress < 96 &&
      fertilizer > 0;

    return (
      <>
        <header className="context-menu__head">
          <div className="context-menu__icon-badge" style={{ background: project.color }}>
            <Sprout size={13} color="#16140f" />
          </div>
          <div className="context-menu__title-group">
            <strong>{project.name}</strong>
            <small>
              {project.kind} · <b>{Math.round(project.progress)}%</b> · {project.stage}
            </small>
          </div>
        </header>

        <div className="context-menu__divider" />

        <div className="context-menu__actions">
          {canHarvest && (
            <button
              type="button"
              className="context-menu__item context-menu__item--highlight"
              onClick={() => {
                onSelectProject(project.id);
                onHarvestProject();
                onClose();
              }}
            >
              <Wheat size={13} />
              <span>Harvest Release</span>
              <span className="context-menu__cost">+120c · +25xp</span>
            </button>
          )}

          {!canHarvest && project.progress < 96 && (
            <>
              <button
                type="button"
                className="context-menu__item"
                disabled={!canTend}
                onClick={() => {
                  onTendProject(project);
                  onClose();
                }}
              >
                <Droplets size={13} />
                <span>Tend Plot (+6% growth)</span>
                <span className="context-menu__cost">−1 ⚡</span>
              </button>

              <button
                type="button"
                className="context-menu__item"
                disabled={!canFertilize}
                onClick={() => {
                  onFertilizeProject(project);
                  onClose();
                }}
              >
                <FlaskConical size={13} />
                <span>Fertilize Plot (+12% growth)</span>
                <span className="context-menu__cost">−1 🧪</span>
              </button>
            </>
          )}

          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onWorkProject(project);
              onClose();
            }}
          >
            <Play size={13} />
            <span>
              {isWorking ? "Active in Swarm" : isQueued ? "Queued in field" : running ? "Queue Plot" : "Launch Swarm"}
            </span>
          </button>

          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onOpenWorkspace(project.id);
              onClose();
            }}
          >
            <FileCode size={13} />
            <span>Open in Product Studio</span>
            <kbd className="context-menu__shortcut">S</kbd>
          </button>

          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onSelectProject(project.id);
              onFocusProject(project.id);
              onClose();
            }}
          >
            <Eye size={13} />
            <span>Inspect plot status</span>
          </button>

          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onCopyText(project.brief, "Plot brief copied");
              onClose();
            }}
          >
            <Copy size={13} />
            <span>Copy brief</span>
          </button>

          <div className="context-menu__divider" />

          <button
            type="button"
            className="context-menu__item context-menu__item--danger"
            onClick={() => {
              if (window.confirm(`Remove plot "${project.name}" from the village?`)) {
                onRemoveProject(project.id);
                onClose();
              }
            }}
          >
            <Trash2 size={13} />
            <span>Replant / Remove Plot</span>
          </button>
        </div>
      </>
    );
  };

  const renderMarketMenu = () => {
    const coins = profile.coins ?? 0;
    const canEnergy = coins >= 35 && (profile.energy ?? 0) < (profile.maxEnergy ?? 8);
    const canFertilizer = coins >= 45;
    const canPlot = coins >= 280 && (profile.plotLimit ?? 6) < 8;

    return (
      <>
        <header className="context-menu__head">
          <div className="context-menu__icon-badge" style={{ background: "#e8b25c" }}>
            <Store size={13} color="#16140f" />
          </div>
          <div className="context-menu__title-group">
            <strong>Village Market</strong>
            <small>{coins} coins · {profile.gems ?? 0} gems</small>
          </div>
        </header>

        <div className="context-menu__divider" />

        <div className="context-menu__actions">
          <button
            type="button"
            className="context-menu__item context-menu__item--highlight"
            onClick={() => {
              onOpenMarket();
              onClose();
            }}
          >
            <ShoppingBag size={13} />
            <span>Browse Full Market</span>
          </button>

          <button
            type="button"
            className="context-menu__item"
            disabled={!canEnergy}
            onClick={() => {
              onBuyMarketItem("energy");
              onClose();
            }}
          >
            <Zap size={13} />
            <span>Energy drink (+3 ⚡)</span>
            <span className="context-menu__cost">35c</span>
          </button>

          <button
            type="button"
            className="context-menu__item"
            disabled={!canFertilizer}
            onClick={() => {
              onBuyMarketItem("fertilizer");
              onClose();
            }}
          >
            <FlaskConical size={13} />
            <span>Plant fertilizer (+1 🧪)</span>
            <span className="context-menu__cost">45c</span>
          </button>

          <button
            type="button"
            className="context-menu__item"
            disabled={!canPlot}
            onClick={() => {
              onBuyMarketItem("plot");
              onClose();
            }}
          >
            <Sprout size={13} />
            <span>Unlock extra plot</span>
            <span className="context-menu__cost">280c</span>
          </button>
        </div>
      </>
    );
  };

  const renderCommonsMenu = () => {
    return (
      <>
        <header className="context-menu__head">
          <div className="context-menu__icon-badge" style={{ background: "#b18ad6" }}>
            <Mic size={13} color="#16140f" />
          </div>
          <div className="context-menu__title-group">
            <strong>The Commons</strong>
            <small>Spatial proximity video & voice room</small>
          </div>
        </header>

        <div className="context-menu__divider" />

        <div className="context-menu__actions">
          <button
            type="button"
            className={`context-menu__item ${inCall ? "context-menu__item--danger" : "context-menu__item--highlight"}`}
            onClick={() => {
              onToggleCall();
              onClose();
            }}
          >
            {inCall ? <MicOff size={13} /> : <Mic size={13} />}
            <span>{inCall ? "Leave Commons Call" : "Join Spatial Audio Room"}</span>
          </button>

          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onWalkTo(0, 0);
              onClose();
            }}
          >
            <Footprints size={13} />
            <span>Walk to Gazebo</span>
          </button>
        </div>
      </>
    );
  };

  const renderGroundMenu = () => {
    return (
      <>
        <header className="context-menu__head">
          <div className="context-menu__icon-badge" style={{ background: "#8fb073" }}>
            <Compass size={13} color="#16140f" />
          </div>
          <div className="context-menu__title-group">
            <strong>Village Grounds</strong>
            <small>
              {worldX.toFixed(1)}, {worldZ.toFixed(1)}
            </small>
          </div>
        </header>

        <div className="context-menu__divider" />

        <div className="context-menu__actions">
          <button
            type="button"
            className="context-menu__item context-menu__item--highlight"
            onClick={() => {
              onWalkTo(worldX, worldZ);
              onClose();
            }}
          >
            <Footprints size={13} />
            <span>Walk here</span>
            <kbd className="context-menu__shortcut">Click</kbd>
          </button>

          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onOpenNewProject();
              onClose();
            }}
          >
            <Sprout size={13} />
            <span>Plant new product plot</span>
            <kbd className="context-menu__shortcut">N</kbd>
          </button>

          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onOpenLibrary();
              onClose();
            }}
          >
            <Layers size={13} />
            <span>Product Library</span>
          </button>

          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onOpenQuests();
              onClose();
            }}
          >
            <Scroll size={13} />
            <span>Quest Board</span>
          </button>

          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onOpenMarket();
              onClose();
            }}
          >
            <Store size={13} />
            <span>Village Market</span>
          </button>

          <div className="context-menu__divider" />

          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onResetView();
              onClose();
            }}
          >
            <RotateCcw size={13} />
            <span>Reset Camera</span>
          </button>
        </div>
      </>
    );
  };

  return (
    <aside
      ref={menuRef}
      className="context-menu"
      role="menu"
      aria-label="Action context menu"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {target.type === "agent" && renderAgentMenu(target.agentId)}
      {target.type === "plot" && renderPlotMenu(target.projectId)}
      {target.type === "market" && renderMarketMenu()}
      {target.type === "commons" && renderCommonsMenu()}
      {target.type === "ground" && renderGroundMenu()}
    </aside>
  );
};
