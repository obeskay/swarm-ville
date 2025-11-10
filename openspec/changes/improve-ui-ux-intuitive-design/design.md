# Design: UI/UX Improvements

## Architecture Overview

### Component Hierarchy

```
App
├── ThemeProvider
├── Toaster (sonner)
├── AppLayout
│   ├── TopToolbar
│   │   ├── BrandingSection
│   │   ├── CenterSection (Space name, status)
│   │   └── RightSection (Theme, settings, profile)
│   ├── LeftSidebar (collapsible)
│   │   ├── SpaceSwitcher
│   │   ├── MissionsPanel
│   │   └── QuickActions
│   ├── MainContent
│   │   ├── SpaceContainer (Pixi.js canvas)
│   │   └── OnboardingTooltips (conditional)
│   ├── RightSidebar (collapsible)
│   │   ├── AgentPanel
│   │   └── MetricsPanel
│   └── BottomStatusBar
│       ├── ConnectionStatus
│       └── NotificationQueue
└── CommandPalette (Cmd+K)
```

## Key Design Decisions

### 1. Onboarding Strategy: Contextual vs Wizard

**Decision**: Replace blocking wizard with contextual tooltips + optional guided tour

**Rationale**:
- Current wizard auto-completes in 500ms, providing zero value
- Users can explore naturally without feeling locked in
- Contextual tips appear when relevant (e.g., "Add Agent" tooltip when hovering button)
- Optional tour for users who want structured guidance
- Integrates with existing "Active Missions" for gamification

**Implementation**:
- Use `react-joyride` for guided tour (battle-tested, accessible)
- Custom `<Tooltip>` wrapper around shadcn components
- Store tour progress in `useUserStore`
- Trigger tooltips based on:
  - First-time actions
  - Hover intent (after 500ms delay)
  - Keyboard navigation (tab focus)

### 2. Layout System: Fixed Sidebars vs Floating Panels

**Decision**: Fixed collapsible sidebars instead of floating panels

**Rationale**:
- Clear visual hierarchy (left = navigation, right = context)
- Predictable locations reduce cognitive load
- Collapsible maintains canvas space when needed
- Industry standard (VS Code, Figma, etc.)

**Constraints**:
- Sidebars width: 280px (left), 320px (right)
- Collapse to 48px icon bar
- Maintain Pixi.js canvas aspect ratio
- Smooth transitions (200ms ease-in-out)

### 3. Feedback System: Toast vs Modal

**Decision**: Toast notifications for all feedback, modals only for critical actions

**Rationale**:
- Toasts non-blocking, user can continue working
- Errors in console invisible to users → move to toasts
- Auto-dismiss for info/success (4s), persist for errors
- Undo actions available in toast (e.g., "Agent deleted. Undo?")

**Implementation**:
- Already using `sonner` library
- Wrap all `invoke()` calls with toast feedback
- Create `useToast` hook for consistent API
- Error boundaries catch React errors → show recovery toast

### 4. State Management: Zustand vs Context

**Decision**: Continue using Zustand for UI state, add new `useUIStore`

**Rationale**:
- Existing stores (`useSpaceStore`, `useUserStore`) work well
- Add `useUIStore` for:
  - Sidebar collapsed state
  - Active tooltips
  - Tour progress
  - Command palette open state
- Persisted to localStorage for preference memory

### 5. Accessibility: Keyboard First

**Decision**: All features accessible via keyboard, mouse enhancement

**Rationale**:
- Keyboard shortcuts discoverable via tooltips
- Command palette (Cmd+K) as universal launcher
- Tab navigation with visible focus rings
- Screen reader announcements for state changes

**Shortcuts**:
```
Cmd/Ctrl + K  → Command palette
Cmd/Ctrl + B  → Toggle left sidebar
Cmd/Ctrl + .  → Toggle right sidebar
Cmd/Ctrl + /  → Toggle help
Cmd/Ctrl + ,  → Settings
?             → Show keyboard shortcuts
Esc           → Close dialogs/panels
```

## Data Flow

### Onboarding Flow
```
User opens app
  ↓
Check `userStore.hasCompletedOnboarding`
  ↓ (false)
Show contextual tooltip on "Create Space" button
  ↓ (user hovers)
Highlight button, show inline tip
  ↓ (user clicks)
Create space → Show next tooltip on agent panel
  ↓ (repeat)
Mark milestone complete → Update missions panel
  ↓ (all milestones)
Set `hasCompletedOnboarding = true`
```

### Error Handling Flow
```
Action triggered (e.g., save space)
  ↓
Try invoke("save_space")
  ↓
Catch error
  ↓
Log to console (dev only)
  ↓
Show error toast with:
  - User-friendly message
  - Retry action button
  - "Report bug" link
  ↓
Update UI state (loading → error)
```

## Performance Considerations

1. **Lazy load tour library**: Only import `react-joyride` when user starts tour
2. **Debounce tooltips**: 500ms hover delay prevents flickering
3. **CSS transitions**: Use transforms instead of width/height for smooth animations
4. **Virtual scrolling**: If agent/mission lists grow large (>50 items)
5. **Memoize components**: Wrap sidebar components in `React.memo`

## Migration Strategy

1. **Phase 1**: Add new layout components alongside old (feature flag)
2. **Phase 2**: Migrate SpaceUI to use new layout
3. **Phase 3**: Replace OnboardingWizard with tour system
4. **Phase 4**: Remove old components, cleanup

**Feature flag**: `ENABLE_NEW_LAYOUT` in environment

## Testing Strategy

- **Unit tests**: Tooltip rendering, keyboard shortcuts
- **Integration tests**: Tour flow, sidebar toggle, error toasts
- **E2E tests**: Complete onboarding journey
- **Visual regression**: Storybook snapshots for all states
- **Accessibility audit**: axe-core, keyboard navigation

## Open Questions for Review

1. Should command palette support fuzzy search or exact match?
2. Persist sidebar state per-space or globally?
3. Auto-show tour on first launch or require explicit trigger?
4. Toast queue limit (max 3 simultaneous)?
