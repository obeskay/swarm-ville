import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSpaceStore } from "../stores/spaceStore";

interface AutoSaveOptions {
  enabled?: boolean;
  interval?: number; // ms
  debounce?: number; // ms
}

/**
 * Auto-save hook that persists spaces and agents to SQLite
 * Implements debouncing and batching for performance
 */
export function useAutoSave(options: AutoSaveOptions = {}) {
  const { enabled = true, interval = 30000, debounce = 2000 } = options;

  const { spaces, agents } = useSpaceStore();
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  // Debounced save function
  const scheduleSave = () => {
    if (!enabled) return;

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Schedule new save
    saveTimerRef.current = setTimeout(async () => {
      const now = Date.now();

      // Skip if saved recently
      if (now - lastSaveRef.current < interval) {
        return;
      }

      try {
        // Save all spaces
        await Promise.all(
          spaces.map(async (space) => {
            try {
              // Try to update first
              await invoke("update_space", { space });
            } catch (error) {
              // If update fails, try to create
              await invoke("save_space", { space });
            }
          })
        );

        // Save all agents
        const agentList = Array.from(agents.values());
        await Promise.all(
          agentList.map(async (agent) => {
            try {
              await invoke("save_agent", { agent });
            } catch (error) {
              console.error("Failed to save agent:", agent.id, error);
            }
          })
        );

        lastSaveRef.current = now;

        if (import.meta.env.DEV) {
          console.log("✅ Auto-saved:", spaces.length, "spaces,", agentList.length, "agents");
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, debounce);
  };

  // Watch for changes and trigger save
  useEffect(() => {
    scheduleSave();
  }, [spaces, agents]);

  // Periodic save (safety net)
  useEffect(() => {
    if (!enabled) return;

    const periodicSave = setInterval(() => {
      scheduleSave();
    }, interval);

    return () => {
      clearInterval(periodicSave);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [enabled, interval]);

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // Force immediate save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Synchronous save (best effort)
      try {
        for (const space of spaces) {
          await invoke("update_space", { space }).catch(() => invoke("save_space", { space }));
        }
      } catch (error) {
        console.error("Save on unload failed:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [spaces]);
}

/**
 * Hook to load persisted data on mount
 */
export function useLoadPersisted() {
  const { spaces, addSpace, agents, addAgent } = useSpaceStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load spaces for current user
        const persistedSpaces = await invoke<any[]>("list_spaces", {
          ownerId: "local-user",
        });

        if (persistedSpaces && persistedSpaces.length > 0) {
          persistedSpaces.forEach((space) => {
            // Convert persisted format to app format
            addSpace({
              id: space.id,
              name: space.name,
              ownerId: space.owner_id,
              dimensions: {
                width: space.width,
                height: space.height,
              },
              tileset: {
                floor: "grass",
                theme: "modern",
              },
              tilemap: space.tilemap ? JSON.parse(space.tilemap) : undefined,
              agents: [],
              settings: {
                proximityRadius: 5,
                maxAgents: 10,
                snapToGrid: true,
              },
              createdAt: space.created_at,
              updatedAt: space.updated_at,
              version: space.version || 1,
            });
          });

          // Load agents for each space
          for (const space of persistedSpaces) {
            try {
              const spaceAgents = await invoke<any[]>("get_agents_by_space", {
                spaceId: space.id,
              });

              spaceAgents.forEach((agent) => {
                addAgent(space.id, {
                  id: agent.id,
                  name: agent.name,
                  spaceId: space.id,
                  ownerId: agent.owner_id || "user1",
                  createdAt: agent.created_at || Date.now(),
                  role: agent.role,
                  position: {
                    x: agent.position_x,
                    y: agent.position_y,
                  },
                  avatar: {
                    icon: "●",
                    color: "#6b7280",
                    emoji: "🤖",
                    spriteId: agent.sprite_id,
                  },
                  model: {
                    provider: "openai" as const,
                    modelName: "gpt-4",
                    useUserCLI: false,
                  },
                  state: "idle",
                });
              });
            } catch (error) {
              console.error("Failed to load agents for space:", space.id, error);
            }
          }

          if (import.meta.env.DEV) {
            console.log("✅ Loaded from persistence:", persistedSpaces.length, "spaces");
          }
        }
      } catch (error) {
        console.error("Failed to load persisted data:", error);
      }
    };

    // Only load if no spaces exist (avoid duplicates)
    if (spaces.length === 0) {
      loadData();
    }
  }, []);
}
