import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import SpaceContainer from "./components/space/SpaceContainer";
import { useSpaceStore } from "./stores/spaceStore";
import { useUserStore, Mission } from "./stores/userStore";
import OnboardingWizard from "./components/onboarding/OnboardingWizard";
import { Button } from "./components/ui/button";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { MapGenerator } from "./lib/ai/MapGenerator";
import { toast } from "sonner";
import { useAutoSave, useLoadPersisted } from "./hooks/useAutoSave";
import { AppLayout } from "./components/layout/AppLayout";
import { TopToolbar } from "./components/layout/TopToolbar";
import { BottomStatusBar } from "./components/layout/BottomStatusBar";
import { LeftSidebar } from "./components/layout/LeftSidebar";
import { RightSidebar } from "./components/layout/RightSidebar";
import { AchievementToastContainer } from "./components/game/AchievementToast";
import { ProgressionDashboard } from "./components/progression/ProgressionDashboard";

function App() {
  const { spaces, addSpace } = useSpaceStore();
  const { hasCompletedOnboarding, setOnboardingComplete, missions } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [activeAchievements, setActiveAchievements] = useState<
    Array<{ id: string; title: string; description: string; progress: number; total: number; xpReward: number; icon?: string }>
  >([]);

  // Enable auto-save and load persisted data
  useAutoSave({ enabled: true, interval: 30000, debounce: 2000 });
  useLoadPersisted();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (!window.__TAURI_IPC__) {
          setInitialized(true);
          return;
        }

        await invoke("init_db");
        await invoke("load_user_data");
        setInitialized(true);
      } catch (error) {
        setInitialized(true);
      }
    };

    if (!initialized) {
      initializeApp();
    }
  }, [initialized]);

  const handleCreateSpace = useCallback(async () => {
    if (loading) return; // Prevent double creation

    // Create space directly - no MapGenerator
    const spaceId = crypto.randomUUID();
    addSpace({
      id: spaceId,
      name: "Startup Office",
      ownerId: "local-user",
      dimensions: {
        width: 80,
        height: 80,
      },
      tileset: {
        floor: "grass",
        theme: "modern",
      },
      tilemap: undefined, // Will load from defaultmap.json
      agents: [],
      settings: {
        proximityRadius: 5,
        maxAgents: 10,
        snapToGrid: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }, [loading, addSpace]);

  // Auto-create space if needed
  useEffect(() => {
    if (initialized && spaces.length === 0 && !loading) {
      handleCreateSpace();
    }
  }, [initialized, spaces.length, loading, handleCreateSpace]);

  // Initialize selectedSpaceId when spaces are available
  useEffect(() => {
    if (spaces.length > 0 && !selectedSpaceId) {
      setSelectedSpaceId(spaces[0].id);
    }
  }, [spaces, selectedSpaceId]);

  // Watch for mission progress changes and show achievement toasts
  useEffect(() => {
    const activeMissions = Object.values(missions).filter((m) => !m.completed);

    // Show toast for missions with recent progress
    activeMissions.forEach((mission) => {
      if (mission.progress > 0) {
        const achievementExists = activeAchievements.some((a) => a.id === mission.id);

        if (!achievementExists) {
          const newAchievement = {
            id: mission.id,
            title: mission.title,
            description: mission.description,
            progress: mission.progress,
            total: mission.total,
            xpReward: 100, // Default XP
            icon: mission.id.includes("first") ? "🎯" : mission.id.includes("create") ? "🤖" : "💬",
          };

          setActiveAchievements((prev) => [...prev, newAchievement]);
        }
      }
    });
  }, [missions, activeAchievements]);

  const handleDismissAchievement = (id: string) => {
    setActiveAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toaster />
      <AchievementToastContainer
        achievements={activeAchievements}
        onDismiss={handleDismissAchievement}
      />
      <ProgressionDashboard />
      {loading ? (
        <div className="flex items-center justify-center w-full h-screen bg-background">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : !hasCompletedOnboarding ? (
        <OnboardingWizard onComplete={() => setOnboardingComplete(true)} />
      ) : spaces.length > 0 && selectedSpaceId ? (
        <AppLayout
          toolbar={<TopToolbar />}
          leftSidebar={<LeftSidebar />}
          rightSidebar={<RightSidebar spaceId={selectedSpaceId} />}
          statusBar={<BottomStatusBar />}
        >
          <SpaceContainer
            spaceId={selectedSpaceId}
            onSpaceChange={setSelectedSpaceId}
          />
        </AppLayout>
      ) : (
        <div className="flex items-center justify-center w-full h-screen bg-background">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
