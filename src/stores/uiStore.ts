import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TourProgress {
  step: number;
  completed: string[];
  isActive: boolean;
}

interface UIState {
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  tourProgress: TourProgress;
  commandPaletteOpen: boolean;

  // Actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
  setTourProgress: (progress: Partial<TourProgress>) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      leftSidebarCollapsed: true,
      rightSidebarCollapsed: true,
      tourProgress: {
        step: 0,
        completed: [],
        isActive: false,
      },
      commandPaletteOpen: false,

      toggleLeftSidebar: () =>
        set((state) => ({
          leftSidebarCollapsed: !state.leftSidebarCollapsed,
        })),

      toggleRightSidebar: () =>
        set((state) => ({
          rightSidebarCollapsed: !state.rightSidebarCollapsed,
        })),

      setLeftSidebarCollapsed: (collapsed) =>
        set({ leftSidebarCollapsed: collapsed }),

      setRightSidebarCollapsed: (collapsed) =>
        set({ rightSidebarCollapsed: collapsed }),

      setTourProgress: (progress) =>
        set((state) => ({
          tourProgress: { ...state.tourProgress, ...progress },
        })),

      setCommandPaletteOpen: (open) =>
        set({ commandPaletteOpen: open }),

      toggleCommandPalette: () =>
        set((state) => ({
          commandPaletteOpen: !state.commandPaletteOpen,
        })),
    }),
    {
      name: "swarmville-ui-preferences",
    }
  )
);
