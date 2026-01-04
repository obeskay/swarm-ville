import { useState, useEffect } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { CommandCenter } from "./components/CommandCenter";
import { CharacterSelector } from "./components/CharacterSelector";
import { Minimap } from "./components/Minimap";
import { HelpOverlay } from "./components/HelpOverlay";
import { WelcomeScreen } from "./components/WelcomeScreen";
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
