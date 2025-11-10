# Layout System

## ADDED Requirements

### Requirement: Collapsible Left Sidebar

The application MUST provide a left sidebar for navigation and quick actions.

####  Scenario: User toggles left sidebar

**GIVEN** the left sidebar is expanded (280px wide)
**WHEN** the user clicks the collapse button OR presses `Cmd/Ctrl+B`
**THEN** the sidebar animates to collapsed state (48px wide) over 200ms
**AND** only icons are visible (no labels)
**AND** the Pixi.js canvas expands to fill available space
**AND** sidebar state is persisted to localStorage as `uiPreferences.leftSidebarCollapsed`
**AND** hovering over collapsed icons shows tooltip with full label

#### Scenario: Sidebar contains space switcher

**GIVEN** the user has multiple spaces created
**WHEN** viewing the left sidebar
**THEN** a "Spaces" section appears at the top
**AND** each space shows as a clickable card with:
- Space name
- Agent count
- Last modified time
**AND** the active space has a highlighted border
**AND** clicking a space switches to that space's canvas

### Requirement: Collapsible Right Sidebar

The application MUST move the agent panel to a right sidebar with additional context panels.

#### Scenario: User toggles right sidebar

**GIVEN** the right sidebar is expanded (320px wide)
**WHEN** the user clicks the collapse button OR presses `Cmd/Ctrl+.`
**THEN** the sidebar animates to collapsed state (48px wide) over 200ms
**AND** the canvas expands to center
**AND** sidebar state persists to localStorage
**AND** collapsed sidebar shows icon badges (e.g., "5" for agent count)

#### Scenario: Right sidebar contains tabs

**GIVEN** the right sidebar is expanded
**WHEN** viewing the sidebar
**THEN** tabs appear at the top: "Agents", "Metrics", "Activity"
**AND** clicking a tab switches the panel content
**AND** the active tab has visual indicator
**AND** tab state persists across sessions

### Requirement: Top Toolbar Organization

The application MUST reorganize the top toolbar into logical sections.

#### Scenario: Toolbar shows clear sections

**GIVEN** the user is viewing any space
**WHEN** looking at the top toolbar
**THEN** three sections are visible:
- **Left**: SwarmVille logo + breadcrumbs ("Space Name › Agents")
- **Center**: Space status indicators (agent count, connection status)
- **Right**: Theme toggle, settings icon, help button
**AND** all sections are horizontally aligned
**AND** the toolbar has a subtle bottom border

#### Scenario: Space status shows real-time info

**GIVEN** a space is active
**WHEN** agents are added/removed
**THEN** the center section updates to show "3 agents"
**AND** the connection indicator shows green dot for connected, red for disconnected
**AND** hovering the connection status shows tooltip: "Connected to WebSocket server"

### Requirement: Bottom Status Bar

The application MUST add a status bar for persistent notifications and system status.

#### Scenario: Status bar shows connection state

**GIVEN** the application is running
**WHEN** the WebSocket connects
**THEN** the bottom-left shows "Connected" with green indicator
**WHEN** the WebSocket disconnects
**THEN** the status updates to "Disconnected - Retrying..." with yellow indicator
**AND** clicking the status opens connection details popover

#### Scenario: Status bar shows notification queue

**GIVEN** multiple actions occur simultaneously (e.g., auto-save, agent spawned, error)
**WHEN** more than one notification is active
**THEN** the bottom-right shows "3 notifications" as a clickable badge
**AND** clicking opens a dropdown with recent notifications
**AND** each notification can be dismissed individually

## MODIFIED Requirements

### Requirement: Migrate AgentPanel to sidebar

The floating `AgentPanel` component MUST be migrated to the right sidebar.

#### Scenario: AgentPanel in new location

**GIVEN** the `AgentPanel.tsx` component exists as a floating panel
**WHEN** migrating to new layout
**THEN** the component is moved to `RightSidebar › Agents` tab
**AND** the collapse/expand functionality is removed (handled by sidebar)
**AND** the panel adapts to sidebar width (320px → 100% of sidebar)

## REMOVED Requirements

### Requirement: Remove floating panel positioning

Floating panels for agents and missions MUST be replaced with sidebar sections.

#### Scenario: No more absolute positioning

**GIVEN** current components use `position: fixed` with manual coordinates
**WHEN** implementing new layout
**THEN** no component uses `bottom-6 right-6` or similar positioning
**AND** all UI elements are within the grid layout:
```
[TopToolbar]
[LeftSidebar | MainContent | RightSidebar]
[BottomStatusBar]
```

## Implementation Notes

- Layout uses CSS Grid for main structure
- Sidebar transitions use `transform: translateX()` for performance
- Breakpoints:
  - < 1024px: Auto-collapse sidebars
  - < 768px: Hide sidebars entirely (mobile fallback)
- Persist layout preferences in `useUIStore.layout` Zustand store
- Use `framer-motion` for smooth transitions
