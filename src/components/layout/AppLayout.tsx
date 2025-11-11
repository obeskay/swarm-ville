import React from "react";
import { useUIStore } from "../../stores/uiStore";
import { useLayoutConfig } from "@/hooks/useLayoutConfig";
import { useThemeConfig } from "@/hooks/useThemeConfig";

interface AppLayoutProps {
  children: React.ReactNode;
  toolbar: React.ReactNode;
  leftSidebar: React.ReactNode;
  rightSidebar: React.ReactNode;
  statusBar: React.ReactNode;
}

export function AppLayout({
  children,
  toolbar,
  leftSidebar,
  rightSidebar,
  statusBar,
}: AppLayoutProps) {
  const leftSidebarCollapsed = useUIStore((state) => state.leftSidebarCollapsed);
  const rightSidebarCollapsed = useUIStore((state) => state.rightSidebarCollapsed);
  const layout = useLayoutConfig();
  const theme = useThemeConfig();

  const sidebarWidth = layout.desktop.sidebarWidth;

  return (
    <div
      style={{
        backgroundColor: theme.colors.surface.dark,
        color: theme.colors.text.dark.primary,
      }}
      className="h-screen w-screen overflow-hidden grid grid-rows-[auto_1fr_auto]"
    >
      {/* Top Toolbar */}
      <div
        style={{
          borderBottomColor: theme.colors.border.dark,
          borderBottomWidth: 1,
        }}
      >
        {toolbar}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-[auto_1fr_auto] overflow-hidden h-full w-full">
        {/* Left Sidebar */}
        <div
          style={{
            width: leftSidebarCollapsed ? "0px" : `${sidebarWidth}px`,
            opacity: leftSidebarCollapsed ? 0 : 1,
            borderRightColor: theme.colors.border.dark,
            borderRightWidth: 1,
            transition: `all 300ms ease-in-out`,
          }}
          className="overflow-hidden"
        >
          {leftSidebar}
        </div>

        {/* Main Content */}
        <div className="overflow-hidden relative flex-1">{children}</div>

        {/* Right Sidebar */}
        <div
          style={{
            width: rightSidebarCollapsed ? "0px" : `${sidebarWidth}px`,
            opacity: rightSidebarCollapsed ? 0 : 1,
            borderLeftColor: theme.colors.border.dark,
            borderLeftWidth: 1,
            transition: `all 300ms ease-in-out`,
          }}
          className="overflow-hidden"
        >
          {rightSidebar}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div
        style={{
          borderTopColor: theme.colors.border.dark,
          borderTopWidth: 1,
        }}
      >
        {statusBar}
      </div>
    </div>
  );
}
