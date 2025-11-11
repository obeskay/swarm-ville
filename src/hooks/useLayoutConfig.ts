/**
 * useLayoutConfig Hook
 * Provides access to layout configuration throughout the app
 * ZERO HARDCODING - all layout dimensions and breakpoints come from config
 */

import React, { useContext } from "react";
import { ConfigContext } from "@/providers/ConfigProvider";

/**
 * Hook to access layout configuration
 *
 * Usage:
 * const layout = useLayoutConfig();
 * const sidebarWidth = layout.desktop.sidebarWidth;
 * const toolbarHeight = layout.toolbar.height;
 *
 * @throws Error if used outside of ConfigProvider
 * @returns Layout configuration object
 */
export function useLayoutConfig() {
  const config = useContext(ConfigContext);

  if (!config) {
    throw new Error(
      "useLayoutConfig must be used within a ConfigProvider. " +
        "Make sure your app is wrapped with <ConfigProvider></ConfigProvider>"
    );
  }

  return config.layout;
}

/**
 * Hook to access responsive breakpoints
 *
 * Usage:
 * const breakpoints = useBreakpoints();
 * if (windowWidth < breakpoints.tablet) {
 *   // Show mobile layout
 * }
 */
export function useBreakpoints() {
  const layout = useLayoutConfig();
  return layout.breakpoints;
}

/**
 * Hook to access current layout variant (desktop, tablet, or mobile)
 *
 * Usage:
 * const variant = useLayoutVariant();
 * const desktopLayout = variant === 'desktop';
 */
export function useLayoutVariant(): "desktop" | "tablet" | "mobile" {
  const breakpoints = useBreakpoints();
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (windowWidth >= breakpoints.desktop) return "desktop";
  if (windowWidth >= breakpoints.tablet) return "tablet";
  return "mobile";
}

/**
 * Hook to get layout values for current screen size
 *
 * Usage:
 * const responsive = useResponsiveLayout();
 * const sidebarWidth = responsive.sidebarWidth;
 * const toolbarHeight = responsive.toolbarHeight;
 */
export function useResponsiveLayout() {
  const layout = useLayoutConfig();
  const variant = useLayoutVariant();

  const layoutVariant = layout[variant as keyof typeof layout];

  return {
    variant,
    sidebarWidth: ("sidebarWidth" in layoutVariant
      ? layoutVariant.sidebarWidth
      : layout.desktop.sidebarWidth) as number,
    toolbarHeight: ("toolbarHeight" in layoutVariant
      ? layoutVariant.toolbarHeight
      : layout.toolbar.height) as number,
    statusBarHeight: ("statusBarHeight" in layoutVariant
      ? layoutVariant.statusBarHeight
      : layout.desktop.statusBarHeight) as number,
  };
}

/**
 * Hook to access sidebar configuration
 *
 * Usage:
 * const sidebar = useSidebarConfig();
 * const width = sidebar.width;
 */
export function useSidebarConfig() {
  const layout = useLayoutConfig();
  return layout.sidebar;
}

/**
 * Hook to access toolbar configuration
 *
 * Usage:
 * const toolbar = useToolbarConfig();
 * const height = toolbar.height;
 */
export function useToolbarConfig() {
  const layout = useLayoutConfig();
  return layout.toolbar;
}

/**
 * Hook to access mission panel configuration
 *
 * Usage:
 * const missions = useMissionPanelConfig();
 * const maxItems = missions.maxVisibleItems;
 */
export function useMissionPanelConfig() {
  const layout = useLayoutConfig();
  return layout.missionPanel;
}

/**
 * Hook to access agent panel configuration
 *
 * Usage:
 * const agents = useAgentPanelConfig();
 * const maxItems = agents.maxVisibleItems;
 */
export function useAgentPanelConfig() {
  const layout = useLayoutConfig();
  return layout.agentPanel;
}

/**
 * Hook to access canvas configuration
 *
 * Usage:
 * const canvas = useCanvasConfig();
 * const tileSize = canvas.tileSize;
 */
export function useCanvasConfig() {
  const layout = useLayoutConfig();
  return layout.canvas;
}
