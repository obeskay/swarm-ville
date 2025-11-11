# Implementation Tasks - Minimalist UI Redesign

**Change ID**: `minimalist-ui-redesign`
**Estimated Duration**: 8-12 days (includes zero-hardcoding configuration system)
**Priority**: High

## Key Principle

**ZERO HARDCODING**: Every value (color, size, spacing, animation) comes from configuration files. No magic numbers, no hardcoded strings in components.

## Task Breakdown by Phase

### Phase 1: Foundation & Configuration System (Days 1-2)

#### Task 1.0: Dynamic Configuration System Setup

- **Description**: Create fully configurable, zero-hardcoded architecture
- **Acceptance Criteria**:
  - [ ] `config/theme.config.ts` created with all colors, typography, spacing
  - [ ] `config/layout.config.ts` created with all breakpoints and dimensions
  - [ ] `config/animations.config.ts` created with all durations and easing
  - [ ] `config/ui.config.ts` created with component-specific settings
  - [ ] ConfigProvider wraps entire app
  - [ ] All config values loaded at runtime (not hardcoded)
  - [ ] Custom config can be loaded from `/config/custom.json`
- **Files Created**:
  - `src/config/theme.config.ts` (new)
  - `src/config/layout.config.ts` (new)
  - `src/config/animations.config.ts` (new)
  - `src/config/ui.config.ts` (new)
  - `src/providers/ConfigProvider.tsx` (new)
  - `src/utils/configLoader.ts` (new)
  - `src/hooks/useThemeConfig.ts` (new)
  - `src/hooks/useLayoutConfig.ts` (new)
  - `src/hooks/useAnimationConfig.ts` (new)
  - `src/hooks/useUIConfig.ts` (new)
- **Dependencies**: None
- **Validation**:
  - No hardcoded color values in any component
  - All config values accessible via hooks
  - Custom config loading works
  - TypeScript strict mode passes

#### Task 1.1: Theme System Setup (Refactored)

- **Description**: Create CSS variables and Tailwind configuration for minimalist theme
- **Acceptance Criteria**:
  - [ ] CSS variables defined in globals.css
  - [ ] Tailwind config updated with custom colors and spacing
  - [ ] Dark mode toggle working (localStorage persistence)
  - [ ] All color combinations meet WCAG AA contrast ratios
- **Files Modified**:
  - `src/styles/globals.css` (new)
  - `tailwind.config.ts`
  - `src/providers/ThemeProvider.tsx` (new)
- **Dependencies**: None
- **Validation**: Visual inspection + contrast checker tool

#### Task 1.2: Create Minimalist Button Component

- **Description**: Build button component with all variants (primary, secondary, icon)
- **Acceptance Criteria**:
  - [ ] Primary button renders and responds to clicks
  - [ ] Secondary button with border style works
  - [ ] Icon button (no text) works
  - [ ] Hover, active, focus, disabled states all visible
  - [ ] Responsive sizing (40px desktop, 36px mobile)
  - [ ] Keyboard accessible (Tab + Enter/Space)
- **Files Created**:
  - `src/components/ui/MinimalButton.tsx` (new)
  - `src/components/ui/MinimalButton.stories.tsx` (Storybook)
- **Tests**:
  - Unit test for click handlers
  - Visual regression test
  - Accessibility test (keyboard, focus ring, ARIA)
- **Validation**: Visual test at 3 breakpoints, axe-core audit

#### Task 1.3: Create Minimalist Card Component

- **Description**: Build reusable card container with consistent padding and borders
- **Acceptance Criteria**:
  - [ ] Card renders with 1px border and appropriate radius
  - [ ] Padding/spacing matches design spec
  - [ ] Works in both light and dark modes
  - [ ] Children render correctly inside
  - [ ] No shadows or transparency used
- **Files Created**:
  - `src/components/ui/MinimalCard.tsx` (new)
- **Validation**: Visual test, dark mode verification

#### Task 1.4: Create Badge Component

- **Description**: Build status badges (online, offline, completed, etc)
- **Acceptance Criteria**:
  - [ ] Five variants working (online, offline, completed, warning, error)
  - [ ] Correct colors for each variant
  - [ ] Proper contrast ratios
  - [ ] Correct font size and padding
- **Files Created**:
  - `src/components/ui/MinimalBadge.tsx` (new)
- **Validation**: Color contrast verification

#### Task 1.5: Create Input Component

- **Description**: Build text input with focus states and validation
- **Acceptance Criteria**:
  - [ ] Input renders with proper styling
  - [ ] Focus state shows blue ring (not transparent)
  - [ ] Placeholder text is visible gray
  - [ ] Disabled state works
  - [ ] Error state shows red border
- **Files Created**:
  - `src/components/ui/MinimalInput.tsx` (new)
- **Validation**: Manual testing all states

---

### Phase 2: Layout System (Days 3-4)

#### Task 2.1: Redesign Top Toolbar

- **Description**: Create minimal top toolbar with logo, theme toggle, and quick actions
- **Acceptance Criteria**:
  - [ ] Toolbar renders with correct height (56px desktop, 44px mobile)
  - [ ] Theme toggle button works
  - [ ] Create space button works
  - [ ] Settings button wired (or placeholder)
  - [ ] Help button wired (or placeholder)
  - [ ] Responsive: buttons resize/hide on mobile
- **Files Modified**:
  - `src/components/layout/TopToolbar.tsx` (redesign)
- **Tests**:
  - Responsive test at 3 breakpoints
  - Theme toggle functionality
- **Validation**: Browser testing at multiple widths

#### Task 2.2: Redesign Left Sidebar (Missions)

- **Description**: Rebuild missions panel with new minimalist style
- **Acceptance Criteria**:
  - [ ] Header renders with correct styling
  - [ ] Mission cards display correctly
  - [ ] Progress bars show with proper colors
  - [ ] Rewards badges visible
  - [ ] Scrolling works if many missions
  - [ ] Collapse functionality on tablet (icon bar)
  - [ ] Overlays on mobile with backdrop
- **Files Modified**:
  - `src/components/layout/LeftSidebar.tsx` (redesign)
  - `src/components/missions/MissionCard.tsx` (new)
- **Tests**:
  - Mission data rendering
  - Responsive collapse behavior
  - Mission progress updates
- **Validation**: Test with 5+ missions, responsive testing

#### Task 2.3: Redesign Right Sidebar (Agents)

- **Description**: Rebuild agent panel with minimalist design
- **Acceptance Criteria**:
  - [ ] Header with agent count badge
  - [ ] Agent items display correctly
  - [ ] Status indicators (online/offline) visible
  - [ ] Message and remove buttons functional
  - [ ] Add agent button opens spawner
  - [ ] Empty state shows when no agents
  - [ ] Collapse on tablet, overlay on mobile
- **Files Modified**:
  - `src/components/layout/RightSidebar.tsx` (redesign)
  - `src/components/agents/AgentItem.tsx` (new)
- **Tests**:
  - Agent list rendering
  - Add agent flow
  - Remove agent flow
  - Responsive behavior
- **Validation**: Test with 0, 1, and 5+ agents

#### Task 2.4: Redesign Bottom Status Bar

- **Description**: Create minimal status bar with metrics
- **Acceptance Criteria**:
  - [ ] Online status indicator with color
  - [ ] FPS counter updates
  - [ ] Agent count displays
  - [ ] Player position shows
  - [ ] Heights correct (32px desktop, 28px mobile)
  - [ ] Colors change for offline state
  - [ ] Performance metrics accurate
- **Files Modified**:
  - `src/components/layout/BottomStatusBar.tsx` (redesign)
- **Tests**:
  - Real-time metric updates
  - Connection status changes
  - Position coordinate accuracy
- **Validation**: Manual testing while playing

#### Task 2.5: Update App Layout Container

- **Description**: Connect all layout pieces into unified app layout
- **Acceptance Criteria**:
  - [ ] All layout sections render correctly
  - [ ] Responsive behavior works (mobile/tablet/desktop)
  - [ ] Game canvas takes correct space
  - [ ] No layout jank or overflow
  - [ ] Theme switching affects all sections
- **Files Modified**:
  - `src/App.tsx` (update layout structure)
- **Tests**:
  - Full app rendering
  - Responsive testing
  - Theme switching
- **Validation**: Full app visual inspection

---

### Phase 3: Functionality & Polish (Days 5-7)

#### Task 3.1: Wire Mission UI to Game State

- **Description**: Connect mission display to actual mission data
- **Acceptance Criteria**:
  - [ ] Mission progress updates as user progresses
  - [ ] Active mission highlighted
  - [ ] Completed mission shows green
  - [ ] All 7 missions display correctly
  - [ ] XP rewards accurate
  - [ ] Sections collapse/expand smoothly
- **Files Modified**:
  - `src/components/missions/MissionCard.tsx` (logic)
  - `src/components/layout/LeftSidebar.tsx` (integration)
- **Tests**:
  - Mission state updates
  - Progress calculation
- **Validation**: Play through missions, verify display

#### Task 3.2: Wire Agent UI to Game State

- **Description**: Connect agent list to actual agent data
- **Acceptance Criteria**:
  - [ ] Agents display with correct status (online/offline)
  - [ ] Agent list updates when spawned
  - [ ] Remove agent works
  - [ ] Message agent works
  - [ ] Empty state shows when no agents
  - [ ] Agent count badge updates
- **Files Modified**:
  - `src/components/agents/AgentItem.tsx` (logic)
  - `src/components/layout/RightSidebar.tsx` (integration)
- **Tests**:
  - Agent spawn/remove flow
  - Status updates
  - Message sending
- **Validation**: Spawn/remove agents, test messaging

#### Task 3.3: Test Game Canvas Integration

- **Description**: Verify game canvas renders correctly alongside new UI
- **Acceptance Criteria**:
  - [ ] Game canvas displays properly
  - [ ] Character visible and movable
  - [ ] Camera follows player
  - [ ] No layout shifting when UI updates
  - [ ] Performance stable (60 FPS)
  - [ ] Touch/mouse input works
- **Files**: No changes (verify integration)
- **Tests**:
  - Game rendering
  - Performance profiling
  - Input handling
- **Validation**: Play the game, verify no regressions

#### Task 3.4: Add Animations & Transitions

- **Description**: Implement smooth animations for UI interactions
- **Acceptance Criteria**:
  - [ ] Button clicks animate (scale 0.95)
  - [ ] Panel open/close slides smoothly (200ms)
  - [ ] Hover effects smooth (150ms)
  - [ ] Theme toggle transitions smoothly
  - [ ] Progress bars animate (300ms)
  - [ ] All animations respect prefers-reduced-motion
- **Files**:
  - `src/styles/animations.css` (new)
  - Component files (add transition classes)
- **Tests**:
  - Animation smoothness (60 FPS)
  - Accessibility (reduced motion)
- **Validation**: Visual inspection, performance profiling

#### Task 3.5: Accessibility Audit & Fixes

- **Description**: Run comprehensive accessibility audit and fix issues
- **Acceptance Criteria**:
  - [ ] axe-core audit: 0 errors
  - [ ] Keyboard navigation works throughout
  - [ ] Focus rings visible everywhere
  - [ ] ARIA labels appropriate
  - [ ] Color contrast WCAG AA everywhere
  - [ ] Screen reader tested
  - [ ] 200% zoom works without scrolling
- **Tools**: axe-core, WAVE, Chrome DevTools
- **Tests**:
  - Automated audit (axe-core)
  - Manual keyboard testing
  - Screen reader testing
- **Validation**: All checks passing

#### Task 3.6: Dark Mode Testing & Refinement

- **Description**: Test dark mode thoroughly and refine colors if needed
- **Acceptance Criteria**:
  - [ ] All colors work in dark mode
  - [ ] Text readable with proper contrast
  - [ ] No transparency in dark mode either
  - [ ] Theme toggle persists preference
  - [ ] No color shifts on reload
- **Files**: CSS variables (refine if needed)
- **Tests**:
  - Manual dark mode testing
  - System dark mode detection
  - localStorage persistence
- **Validation**: Visual inspection in both modes

---

### Phase 4: Testing & Documentation (Days 8-10)

#### Task 4.1: Cross-Browser & Device Testing

- **Description**: Test on multiple browsers and devices
- **Acceptance Criteria**:
  - [ ] Chrome/Firefox/Safari: All working
  - [ ] Mobile Safari: All working
  - [ ] Android Chrome: All working
  - [ ] Windows/Mac/Linux: All working
  - [ ] Touch interfaces: All working
  - [ ] Keyboard only: All working
- **Browsers to Test**:
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)
  - Chrome Android
  - Safari iOS
- **Validation**: Manual testing on real devices or emulators

#### Task 4.2: Performance Profiling

- **Description**: Ensure no performance regression
- **Acceptance Criteria**:
  - [ ] Lighthouse score ≥90
  - [ ] FPS ≥60 during gameplay
  - [ ] No layout jank
  - [ ] Components memoized correctly
  - [ ] Bundle size < 500KB
  - [ ] Initial load < 2 seconds
- **Tools**: Lighthouse, Chrome DevTools, Profiler
- **Validation**: Performance metrics meeting targets

#### Task 4.3: Create Component Documentation

- **Description**: Document all new components for developers
- **Acceptance Criteria**:
  - [ ] Storybook stories for all components
  - [ ] Props documented with JSDoc
  - [ ] Usage examples provided
  - [ ] Accessibility notes included
  - [ ] Color/spacing guidelines documented
- **Files**:
  - `src/components/**/*.stories.tsx` (Storybook stories)
  - `docs/COMPONENT_GUIDE.md` (new)
- **Validation**: Storybook runs without errors

#### Task 4.4: Create Design System Documentation

- **Description**: Document the design system for consistency
- **Acceptance Criteria**:
  - [ ] Color palette documented
  - [ ] Spacing system documented
  - [ ] Typography system documented
  - [ ] Component checklist documented
  - [ ] Accessibility guidelines documented
  - [ ] Dark mode guidelines documented
- **Files**:
  - `docs/DESIGN_SYSTEM.md` (new)
  - `docs/COLORS.md` (new)
  - `docs/ACCESSIBILITY.md` (new)
- **Validation**: Documentation complete and clear

#### Task 4.5: Final QA & Polish

- **Description**: Last round of testing and refinement
- **Acceptance Criteria**:
  - [ ] All missions display and track correctly
  - [ ] All agents spawn and function correctly
  - [ ] All buttons functional
  - [ ] No console errors
  - [ ] No visual bugs
  - [ ] All animations smooth
  - [ ] Dark mode perfect
- **Validation**: Full playthru of game with UI inspection

#### Task 4.6: Create Migration Guide

- **Description**: Document changes for other developers
- **Acceptance Criteria**:
  - [ ] What changed documented
  - [ ] Migration path for custom styles documented
  - [ ] New component APIs documented
  - [ ] Breaking changes listed
  - [ ] Examples provided
- **Files**:
  - `docs/MIGRATION_GUIDE.md` (new)
- **Validation**: Guide is clear and complete

---

## Parallel Work Opportunities

**Can be done in parallel**:

- Task 1.2 + 1.3 + 1.4 + 1.5 (different components)
- Task 2.2 + 2.3 + 2.4 (different layout sections)
- Task 3.1 + 3.2 (different features)
- Task 4.1 + 4.2 (different testing)

**Must be sequential**:

- 1.1 must complete before others (provides theme system)
- 2.1 must complete before 2.2/2.3/2.4 (provides toolbar)
- Phase 2 must complete before Phase 3 (foundation needed)
- Phase 3 must complete before Phase 4 (need working features)

---

## Success Verification Checklist

- [ ] **Zero Transparency**: No transparent overlays in entire UI
- [ ] **Full Functionality**: All 7 missions track, agents spawn, UI responsive
- [ ] **Minimalist Design**: No unnecessary elements, clean visual hierarchy
- [ ] **Accessibility**: WCAG AA compliant, axe-core 0 errors
- [ ] **Performance**: Lighthouse ≥90, FPS ≥60
- [ ] **Responsive**: Works at all breakpoints (mobile/tablet/desktop)
- [ ] **Dark Mode**: Perfect in both light and dark
- [ ] **Cross-Browser**: Works on all major browsers
- [ ] **Documentation**: All components and patterns documented
- [ ] **Tests**: Unit tests passing, visual regression passing

---

## Risk Mitigation

| Risk                              | Mitigation                                |
| --------------------------------- | ----------------------------------------- |
| Layout breaks on small screens    | Early mobile testing in Phase 2           |
| Mission/agent data doesn't update | Wire to state early in Phase 3            |
| Performance regression            | Profile early and often (Task 4.2)        |
| Accessibility issues              | Run axe-core regularly (Task 3.5)         |
| Colors not matching design        | Use CSS variables consistently (Task 1.1) |

---

## Rollback Plan

If critical issues arise:

1. Create feature branch `feature/minimalist-ui-rollback`
2. Revert layout components to previous version
3. Keep new component library (reusable)
4. Plan iterative approach instead
5. Deploy previous UI while fixing issues

---

## Notes

- All file paths relative to project root
- Estimated day = 8 hours of work
- Early testing catches issues faster than late QA
- Document everything as you go (easier than retroactively)
- Git commit frequently for easy rollback if needed
