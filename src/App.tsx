import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import SpaceContainer from "./components/space/SpaceContainer";
import { useSpaceStore } from "./stores/spaceStore";
import { useUserStore } from "./stores/userStore";
import OnboardingWizard from "./components/onboarding/OnboardingWizard";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { useAutoSave, useLoadPersisted } from "./hooks/useAutoSave";
import { AppLayout } from "./components/layout/AppLayout";
import { TopToolbar } from "./components/layout/TopToolbar";
import { BottomStatusBar } from "./components/layout/BottomStatusBar";
import { LeftSidebar } from "./components/layout/LeftSidebar";
import { RightSidebar } from "./components/layout/RightSidebar";
import { ProgressionDashboard } from "./components/progression/ProgressionDashboard";
import { generateDefaultSpaceConfig } from "./lib/spaceGenerator";

function App() {
  const { spaces, addSpace } = useSpaceStore();
  const {
    hasCompletedOnboarding,
    setOnboardingComplete,
    initializePlayerStats,
    isInitialized: playerStatsInitialized,
  } = useUserStore();
  const [loading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

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

  // Initialize player stats after Tauri initialization
  useEffect(() => {
    if (initialized && !playerStatsInitialized) {
      initializePlayerStats();
    }
  }, [initialized, playerStatsInitialized, initializePlayerStats]);

  const handleCreateSpace = useCallback(async () => {
    if (loading) return; // Prevent double creation

    // Generate dynamic space configuration instead of hardcoded values
    const spaceConfig = generateDefaultSpaceConfig();
    const spaceId = crypto.randomUUID();

    addSpace({
      id: spaceId,
      name: spaceConfig.name,
      ownerId: "local-user",
      dimensions: spaceConfig.dimensions,
      tileset: {
        floor: spaceConfig.floor,
        theme: spaceConfig.theme,
      },
      tilemap: undefined, // Will load from defaultmap.json
      agents: [],
      settings: spaceConfig.settings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }, [loading, addSpace]);

  // Auto-create space if needed
  useEffect(() => {
    if (initialized && playerStatsInitialized && spaces.length === 0 && !loading) {
      handleCreateSpace();
    }
  }, [initialized, playerStatsInitialized, spaces.length, loading, handleCreateSpace]);

  // Initialize selectedSpaceId when spaces are available
  useEffect(() => {
    if (spaces.length > 0 && !selectedSpaceId) {
      setSelectedSpaceId(spaces[0].id);
    }
  }, [spaces, selectedSpaceId]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toaster />
      {/* Note: activeAchievements are mission progress displays, not achievements */}
      <ProgressionDashboard />
      {!initialized || !playerStatsInitialized || loading ? (
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
          <SpaceContainer spaceId={selectedSpaceId} onSpaceChange={setSelectedSpaceId} />
        </AppLayout>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-screen bg-background gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">No Spaces Yet</h2>
            <p className="text-muted-foreground mb-6">Create your first workspace to get started</p>
            <button
              onClick={handleCreateSpace}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Create Space
            </button>
          </div>
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
