# Tasks: Improve UI/UX for Intuitive Design

## Phase 1: Foundation (Days 1-2)

### Dependencies & Setup

- [ ] Install required dependencies
  - `pnpm add react-joyride cmdk react-hotkeys-hook framer-motion`
  - `pnpm add -D @types/react-joyride`
- [ ] Create `useUIStore` for UI preferences
  - Add Zustand store at `src/stores/uiStore.ts`
  - Schema: `{ leftSidebarCollapsed, rightSidebarCollapsed, tourProgress, commandPaletteOpen }`
  - Persist to localStorage with `zustand/middleware`
- [ ] Create feature flag system
  - Add `VITE_ENABLE_NEW_LAYOUT` to `.env`
  - Create utility `src/lib/feature-flags.ts` to check flags

### Base Layout Components

- [ ] Create `AppLayout` component
  - File: `src/components/layout/AppLayout.tsx`
  - CSS Grid structure: `[toolbar] [sidebar|content|sidebar] [statusbar]`
  - Responsive breakpoints: 1024px, 768px
  - Test: Layout renders with all sections
- [ ] Create `TopToolbar` component
  - File: `src/components/layout/TopToolbar.tsx`
  - Three sections: left (branding), center (status), right (actions)
  - Test: All sections align correctly
- [ ] Create `BottomStatusBar` component
  - File: `src/components/layout/BottomStatusBar.tsx`
  - Connection status indicator (left)
  - Notification queue badge (right)
  - Test: Status updates reactively

## Phase 2: Sidebars (Days 3-4)

### Left Sidebar

- [ ] Create `LeftSidebar` component
  - File: `src/components/layout/LeftSidebar.tsx`
  - Collapsible with `transform: translateX()` animation
  - Width: 280px expanded, 48px collapsed
  - Test: Collapse/expand transitions smoothly
- [ ] Create `SpaceSwitcher` sub-component
  - Shows list of user spaces
  - Active space highlighted
  - Click to switch space
  - Test: Switching spaces updates canvas
- [ ] Create `MissionsPanel` sub-component
  - Migrate existing Active Missions UI
  - Show progress bars for each mission
  - Highlight next uncompleted mission
  - Test: Missions update when actions complete
- [ ] Add keyboard shortcut `Cmd/Ctrl+B` for toggle
  - Use `react-hotkeys-hook`
  - Persist state to `useUIStore`
  - Test: Shortcut works, state persists

### Right Sidebar

- [ ] Create `RightSidebar` component
  - File: `src/components/layout/RightSidebar.tsx`
  - Tabbed interface: Agents, Metrics, Activity
  - Width: 320px expanded, 48px collapsed
  - Test: Tab switching works, state persists
- [ ] Migrate `AgentPanel` to sidebar tab
  - Move `AgentPanel.tsx` logic to `RightSidebar > Agents` tab
  - Remove floating panel positioning
  - Adapt to sidebar width (100% of 320px)
  - Test: Agent panel functions identically
- [ ] Create `MetricsPanel` tab (stub)
  - Placeholder content: "Metrics coming soon"
  - Structure for future swarm metrics
  - Test: Tab renders without errors
- [ ] Add keyboard shortcut `Cmd/Ctrl+.` for toggle
  - Use `react-hotkeys-hook`
  - Test: Shortcut works, badge shows agent count when collapsed

## Phase 3: Onboarding System (Days 5-6)

### Contextual Tooltips

- [ ] Create enhanced `Tooltip` wrapper
  - File: `src/components/ui/enhanced-tooltip.tsx`
  - Extend shadcn `Tooltip` with delay prop (default 500ms)
  - Add keyboard focus support
  - Test: Tooltip shows on hover and keyboard focus
- [ ] Add tooltips to all toolbar buttons
  - Theme toggle, settings, help, etc.
  - Include keyboard shortcuts in tooltip text
  - Test: All buttons have descriptive tooltips
- [ ] Create onboarding tooltip system
  - File: `src/lib/onboarding/tooltips.ts`
  - Define tooltip content for first-time users
  - Show pulsing indicator on high-priority tooltips
  - Test: Tooltips appear for new users only

### Guided Tour

- [ ] Set up `react-joyride` tour system
  - Create tour steps config at `src/lib/onboarding/tourSteps.ts`
  - 7 steps: Create Space → Add Agent → View Missions → Complete Mission → Settings → Help → Done
  - Test: Tour progresses through all steps
- [ ] Create tour trigger button
  - Add "Start Tour" button to help menu
  - Add `?` keyboard shortcut to open tour
  - Test: Tour starts from any screen
- [ ] Implement tour persistence
  - Save progress to `userStore.tourProgress`
  - Allow resume if user exits midway
  - Mark tour complete when finished
  - Test: Tour resumes from saved step

### Mission Integration

- [ ] Update missions to trigger on actions
  - Hook into `addAgent`, `addSpace`, etc.
  - Update mission progress in `useUserStore`
  - Show toast on mission completion
  - Test: All missions complete correctly
- [ ] Set `hasCompletedOnboarding` when done
  - After all missions complete
  - Disable contextual tooltips
  - Test: Onboarding state persists

## Phase 4: Feedback System (Days 7-8)

### Toast Notifications

- [ ] Create `useToast` wrapper hook
  - File: `src/hooks/useToast.ts`
  - Wrap `sonner` library with custom defaults
  - Methods: `toast.success()`, `toast.error()`, `toast.info()`
  - Test: Toasts appear with correct styling
- [ ] Add toasts to all Tauri invoke calls
  - Wrap `invoke()` in try-catch blocks
  - Show success toast for user-facing actions
  - Show error toast with retry button for failures
  - Test: All actions show feedback
- [ ] Replace console errors with toasts
  - Find all `console.error()` in codebase
  - Replace with `toast.error()` + dev console log
  - Migrate `useAutoSave` error handling
  - Test: No errors hidden from user

### Error Boundaries

- [ ] Create `ErrorBoundary` component
  - File: `src/components/error/ErrorBoundary.tsx`
  - Friendly error UI with reload button
  - Log errors to console
  - Test: Boundary catches and displays errors
- [ ] Wrap key components in boundaries
  - `<App>` root
  - `<SpaceContainer>` canvas
  - Each sidebar panel
  - Test: Errors contained to affected component
- [ ] Create critical error boundary
  - Full-screen error state for unrecoverable errors
  - "Reload Application" button
  - Test: Critical errors caught gracefully

### Loading & Empty States

- [ ] Create skeleton components
  - `SpaceCanvasSkeleton` for loading spaces
  - `AgentListSkeleton` for loading agents
  - Pulsing animation with shimmer effect
  - Test: Skeletons match actual layout
- [ ] Create empty state components
  - `EmptyAgents`, `EmptySpaces`, `EmptyMissions`
  - Helpful messaging + CTA buttons
  - Test: Empty states show correct actions
- [ ] Add loading states to async operations
  - Space switching
  - Agent spawning
  - Data persistence
  - Test: All async ops show feedback

## Phase 5: Navigation & Discovery (Days 9-10)

### Command Palette

- [ ] Create `CommandPalette` component
  - File: `src/components/navigation/CommandPalette.tsx`
  - Use `cmdk` library
  - List all available actions
  - Test: Palette opens with `Cmd+K`
- [ ] Implement fuzzy search
  - Filter commands based on user input
  - Highlight matching text
  - Test: Search finds relevant commands
- [ ] Add command execution
  - Execute action on Enter or click
  - Close palette after execution
  - Update recent commands list
  - Test: All commands execute correctly

### Keyboard Shortcuts

- [ ] Create shortcuts configuration
  - File: `src/lib/keyboard-shortcuts.ts`
  - Define all shortcuts with descriptions
  - Test: Config is type-safe
- [ ] Implement global shortcuts
  - `A` → Add Agent
  - `N` → New Space
  - `?` → Show shortcuts help
  - Test: Shortcuts work from any screen
- [ ] Prevent shortcuts in inputs
  - Check `document.activeElement.tagName`
  - Only trigger when no input focused
  - Test: Typing in inputs doesn't trigger shortcuts
- [ ] Create keyboard shortcuts modal
  - Show all shortcuts grouped by category
  - Open with `?` key
  - Test: Modal displays all shortcuts

### Contextual Help

- [ ] Create help content files
  - File: `src/lib/help/contextual-help.ts`
  - Content for each major feature
  - Test: Help text is clear and concise
- [ ] Add help buttons to panels
  - Small `?` icon in panel headers
  - Popover shows contextual help
  - Test: Help appears for all panels
- [ ] Add "Learn more" links
  - Link to online documentation
  - Test: Links open in new tab

### Breadcrumb Navigation

- [ ] Create `Breadcrumbs` component
  - File: `src/components/navigation/Breadcrumbs.tsx`
  - Show current navigation path
  - Clickable segments
  - Test: Breadcrumbs update with navigation
- [ ] Integrate breadcrumbs in toolbar
  - Show in left section of top toolbar
  - Adapt to selected space/agent
  - Test: Breadcrumbs match current state

## Phase 6: Migration & Cleanup (Day 11)

### Component Migration

- [ ] Enable new layout behind feature flag
  - Test both old and new layouts work
  - Get user feedback on new layout
- [ ] Deprecate `OnboardingWizard`
  - Add deprecation notice
  - Keep for backward compatibility
  - Test: Old wizard still works if flag disabled
- [ ] Remove floating panel CSS
  - Clean up `position: fixed` positioning
  - Remove manual coordinate calculations
  - Test: No layout regressions

### Final Polish

- [ ] Add smooth transitions
  - CSS transitions for all state changes
  - Framer Motion for complex animations
  - Test: Transitions feel smooth (no jank)
- [ ] Accessibility audit
  - Run axe-core in browser
  - Test keyboard navigation
  - Test screen reader announcements
  - Fix any issues found
- [ ] Performance optimization
  - Lazy load tour library
  - Memoize heavy components
  - Profile with React DevTools
  - Test: No performance regressions

### Documentation & Testing

- [ ] Write Storybook stories
  - Stories for all new components
  - Multiple states (collapsed, expanded, loading, error)
  - Test: Stories render correctly
- [ ] Update user documentation
  - Document keyboard shortcuts
  - Document new layout
  - Document onboarding flow
- [ ] Write E2E tests
  - Complete onboarding journey
  - Sidebar collapse/expand
  - Command palette usage
  - Test: All critical paths work

## Validation Checklist

Before marking change as complete, verify:

- [ ] New users can complete first space creation without docs
- [ ] Zero auto-save errors visible in console (all shown as toasts)
- [ ] 100% of interactive elements have tooltips
- [ ] Onboarding tour can be completed end-to-end
- [ ] Layout provides ≤2 clicks to any feature
- [ ] All keyboard shortcuts work
- [ ] Error boundaries catch and display errors gracefully
- [ ] Command palette finds all actions
- [ ] Accessibility score >90 in Lighthouse
- [ ] No visual regressions (screenshot diff)

## Dependencies Between Tasks

- Sidebars depend on AppLayout
- Tour depends on tooltips
- Command palette depends on shortcuts config
- Breadcrumbs depend on navigation state
- Migration depends on all features working

## Parallelizable Work

Can be worked on simultaneously:
- Phase 1 + Phase 2 (different files)
- Phase 3 + Phase 4 (different systems)
- Phase 5 components (independent features)
