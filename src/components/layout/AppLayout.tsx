import React from "react";
import { useUIStore } from "../../stores/uiStore";
import { PanelLeft, PanelRight } from "lucide-react";
import { Button } from "../ui/button";

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
  const toggleLeftSidebar = useUIStore((state) => state.toggleLeftSidebar);
  const toggleRightSidebar = useUIStore((state) => state.toggleRightSidebar);

  return (
    <div className="h-screen w-screen overflow-hidden grid grid-rows-[auto_1fr_auto] bg-background">
      {/* Top Toolbar */}
      <div className="border-b border-border">{toolbar}</div>

      {/* Main Content Area */}
      <div className="grid grid-cols-[auto_1fr_auto] overflow-hidden">
        {/* Left Sidebar */}
        {!leftSidebarCollapsed && (
          <div className="w-[280px] border-r border-border">{leftSidebar}</div>
        )}

        {/* Main Content */}
        <div className="overflow-hidden relative bg-muted/30 flex-1">{children}</div>

        {/* Right Sidebar */}
        {!rightSidebarCollapsed && (
          <div className="w-[320px] border-l border-border">{rightSidebar}</div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="border-t border-border">{statusBar}</div>
    </div>
  );
}
