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
import { BottomStatusBarNew } from "./components/layout/BottomStatusBarNew";
import { LeftSidebarNew } from "./components/layout/LeftSidebarNew";
import { RightSidebarNew } from "./components/layout/RightSidebarNew";
import { ProgressionDashboard } from "./components/progression/ProgressionDashboard";
import { generateDefaultSpaceConfig, generateOfficeSpaceConfig } from "./lib/spaceGenerator";
import { ConfigProvider } from "./providers/ConfigProvider";

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

  const handleCreateSpace = useCallback(
    async (isOffice: boolean = true) => {
      if (loading) return; // Prevent double creation

      // Use office config if requested, otherwise default
      const spaceConfig = isOffice ? generateOfficeSpaceConfig() : generateDefaultSpaceConfig();
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
        tilemap: undefined, // Will load from defaultmap.json or officemap.json
        agents: [],
        settings: spaceConfig.settings,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      });

      // Auto-navigate to the new space
      setSelectedSpaceId(spaceId);
    },
    [loading, addSpace]
  );

  // Wrapper for button click handler
  const handleCreateSpaceClick = useCallback(() => {
    handleCreateSpace(true);
  }, [handleCreateSpace]);

  // Auto-create office space if needed
  useEffect(() => {
    if (initialized && playerStatsInitialized && spaces.length === 0 && !loading) {
      // Create office space by default for better visuals
      handleCreateSpace(true);
    }
  }, [initialized, playerStatsInitialized, spaces.length, loading, handleCreateSpace]);

  // Initialize selectedSpaceId when spaces are available
  useEffect(() => {
    if (spaces.length > 0 && !selectedSpaceId) {
      setSelectedSpaceId(spaces[0].id);
    }
  }, [spaces, selectedSpaceId]);

  return (
    <ConfigProvider>
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
            leftSidebar={<LeftSidebarNew />}
            rightSidebar={<RightSidebarNew spaceId={selectedSpaceId} />}
            statusBar={<BottomStatusBarNew />}
          >
            <SpaceContainer spaceId={selectedSpaceId} onSpaceChange={setSelectedSpaceId} />
          </AppLayout>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-screen bg-background gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">No Spaces Yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first workspace to get started
              </p>
              <button
                onClick={handleCreateSpaceClick}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Create Office
              </button>
            </div>
          </div>
        )}
      </ThemeProvider>
    </ConfigProvider>
  );
}

export default App;
