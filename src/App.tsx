import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import SpaceContainer from "./components/space/SpaceContainer";
import { useSpaceStore } from "./stores/spaceStore";
import { useUserStore } from "./stores/userStore";
import OnboardingWizard from "./components/onboarding/OnboardingWizard";
import "./App.css";

function App() {
  const { spaces } = useSpaceStore();
  const { hasCompletedOnboarding, setOnboardingComplete } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        await invoke("init_db");

        // Load user data
        const userData = await invoke("load_user_data");
        console.log("User data loaded:", userData);

        setLoading(false);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground">Initializing SwarmVille...</p>
        </div>
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingWizard onComplete={() => setOnboardingComplete(true)} />;
  }

  if (spaces.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">No Spaces Yet</h1>
          <p className="text-muted-foreground mb-6">
            Create your first space to get started
          </p>
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            Create Space
          </button>
        </div>
      </div>
    );
  }

  return <SpaceContainer spaceId={spaces[0].id} />;
}

export default App;
