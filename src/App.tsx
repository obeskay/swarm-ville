import { useState, useEffect } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { CommandCenter } from "./components/CommandCenter";
import { CharacterSelector } from "./components/CharacterSelector";
import { Minimap } from "./components/Minimap";
import { HelpOverlay } from "./components/HelpOverlay";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { MetricsPanel } from "./components/MetricsPanel";
import { ProjectsPanel } from "./components/ProjectsPanel";
import { PhaseIndicator, usePhaseCycler, Phase } from "./components/PhaseIndicator";
import { Toaster } from "sonner";
import { PhaseIndicator, usePhaseCycler, Phase } from "./components/PhaseIndicator";
import { Toaster } from "sonner";

type AppState = "welcome" | "character" | "game";

function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    // Check if user has seen welcome before
    const hasSeenWelcome = localStorage.getItem("swarmville_welcomed");
    return hasSeenWelcome ? "character" : "welcome";
  });

  const [selectedCharacter, setSelectedCharacter] = useState(
    "/sprites/characters/Character_001.png"
  );

  const [showProjects, setShowProjects] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const [agentActivity, setAgentActivity] = useState<Array<{
    id: string;
    name: string;
    messages: number;
    tokens: number;
    lastActive: number;
  }>>([]);

  const phaseCycler = usePhaseCycler();

  const handleWelcomeComplete = () => {
    localStorage.setItem("swarmville_welcomed", "true");
    setAppState("character");
  };

  const handleCharacterSelect = (path: string) => {
    console.log(`[App] Character selected: ${path}`);
    setSelectedCharacter(path);
    // Set on window BEFORE transitioning to game state
    (window as unknown as { selectedCharacterPath: string }).selectedCharacterPath = path;
    setAppState("game");
  };

  const handleCharacterSkip = () => {
    console.log(`[App] Character skipped, using default: ${selectedCharacter}`);
    // Set on window BEFORE transitioning to game state
    (window as unknown as { selectedCharacterPath: string }).selectedCharacterPath =
      selectedCharacter;
    setAppState("game");
  };

  // Sync phase with game engine
  useEffect(() => {
    const game = (window as unknown as { game?: { setPhase?: (phase: Phase) => void } }).game;
    if (game?.setPhase) {
      game.setPhase(phaseCycler.phase);
    }
  }, [phaseCycler.phase]);

  // Keyboard shortcut to reset welcome
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "R") {
        localStorage.removeItem("swarmville_welcomed");
        setAppState("welcome");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Game canvas - always mounted for faster load */}
      {appState === "game" && <GameCanvas />}

      {/* UI Overlays - only when in game */}
      {appState === "game" && (
        <>
          <CommandCenter />
          <Minimap />
          <HelpOverlay />

          {/* Phase Indicator - Top Left */}
          <div className="absolute top-3 left-3 z-40">
            <PhaseIndicator
              currentPhase={phaseCycler.phase}
              phaseProgress={phaseCycler.progress}
              cycleCount={phaseCycler.cycleCount}
            />
          </div>

          {/* Metrics Panel - Bottom Left */}
          {showMetrics && (
            <div className="absolute bottom-3 left-3 z-40">
              <MetricsPanel agents={agentActivity} />
            </div>
          )}

          {/* Projects Panel - Bottom Center (toggleable) */}
          {showProjects && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40">
              <ProjectsPanel />
            </div>
          )}

          {/* Toggle Buttons */}
          <div className="absolute bottom-3 right-3 flex gap-2 z-40">
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="px-2 py-1 text-xs bg-card/90 border border-border/50 rounded hover:bg-card transition-colors"
            >
              {showMetrics ? "Hide Metrics" : "Show Metrics"}
            </button>
            <button
              onClick={() => setShowProjects(!showProjects)}
              className="px-2 py-1 text-xs bg-card/90 border border-border/50 rounded hover:bg-card transition-colors"
            >
              {showProjects ? "Hide Projects" : "Show Projects"}
            </button>
          </div>
        </>
      )}

      {/* Toast notifications */}
      <Toaster
        position="bottom-center"
        theme="dark"
        toastOptions={{
          className: "border-border/50 bg-card/95 backdrop-blur-xl",
          duration: 4000,
        }}
      />

      {/* Welcome screen */}
      {appState === "welcome" && <WelcomeScreen onComplete={handleWelcomeComplete} />}

      {/* Character selector */}
      {appState === "character" && (
        <CharacterSelector onSelect={handleCharacterSelect} onClose={handleCharacterSkip} />
      )}
    </div>
  );
}

export default App;
