import { useState } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { AgentSpawner } from "./components/AgentSpawner";
import { CharacterSelector } from "./components/CharacterSelector";
import { Toaster } from "sonner";

function App() {
  const [showCharacterSelector, setShowCharacterSelector] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState(
    "/sprites/characters/Character_001.png"
  );

  const handleCharacterSelect = (path: string) => {
    setSelectedCharacter(path);
    setShowCharacterSelector(false);
    // Store in window for GameApp to use
    (window as any).selectedCharacterPath = path;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <GameCanvas />
      <AgentSpawner />
      <Toaster position="bottom-right" theme="dark" />

      {showCharacterSelector && (
        <CharacterSelector
          onSelect={handleCharacterSelect}
          onClose={() => {
            setShowCharacterSelector(false);
            // Use default character if cancelled
            (window as any).selectedCharacterPath = selectedCharacter;
          }}
        />
      )}
    </div>
  );
}

export default App;
