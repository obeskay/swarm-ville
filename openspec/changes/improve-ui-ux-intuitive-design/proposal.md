# Improve UI/UX for Intuitive Design

## Problem

The current UI has several usability issues that make the app less intuitive:

1. **Intrusive onboarding**: Full-screen wizard blocks the entire interface and auto-completes after 500ms, providing no real guidance
2. **Poor spatial organization**: Floating panels, no clear hierarchy, important actions hidden
3. **Lack of visual feedback**: Errors appear only in console (e.g., auto-save failures), no user-facing notifications
4. **Undiscoverable features**: Buttons lack tooltips, no contextual help system
5. **Disconnected tutorial**: "Active Missions" panel exists but isn't integrated with onboarding flow

## Goals

Transform SwarmVille into an intuitive, welcoming application by:

1. **Non-intrusive onboarding**: Contextual tooltips + optional guided tour instead of blocking wizard
2. **Efficient layout**: Organized sidebar with collapsible panels, clear visual hierarchy
3. **Rich feedback**: Toast notifications, error boundaries, smooth loading states
4. **Discoverable UI**: Comprehensive tooltips, keyboard shortcuts, contextual help
5. **Progressive disclosure**: Show features gradually as users need them

## Approach

### 1. Onboarding System (Non-blocking)
- Replace full-screen wizard with **contextual tooltips** that appear near relevant UI elements
- Add **optional guided tour** using spotlight/highlight technique (similar to Intro.js)
- Integrate with "Active Missions" for progressive learning
- Allow users to skip, pause, or restart tutorial anytime

### 2. Layout Reorganization
- Add **collapsible left sidebar** for:
  - Space switcher
  - Active Missions / Tutorial progress
  - Quick actions
- Move **agent panel to right sidebar** (collapsible)
- **Top toolbar** with clear sections:
  - Left: App branding + breadcrumbs
  - Center: Space name + status indicators
  - Right: Theme toggle, settings, user profile
- **Bottom status bar** for connection status, notifications

### 3. Visual Feedback System
- **Toast notifications** for all user actions (save, errors, success)
- **Error boundaries** with friendly messages and recovery options
- **Loading states** with skeletons and progress indicators
- **Smooth transitions** using CSS animations + Framer Motion
- **Empty states** with helpful CTAs instead of "No agents yet"

### 4. Navigation & Discovery
- **Tooltips** on all interactive elements with keyboard shortcuts
- **Command palette** (Cmd/Ctrl+K) for quick navigation
- **Contextual help button** (?) that shows relevant docs
- **Keyboard shortcuts** displayed in menus and tooltips

## Non-Goals

- Complete redesign of visual style (keep current theme system)
- Mobile-first responsive layout (focus on desktop experience first)
- Advanced accessibility features (WCAG compliance can be follow-up)

## Success Criteria

1. New users can complete first space creation without reading docs
2. Zero auto-save errors visible in UI (all shown as toasts)
3. 100% of interactive elements have tooltips
4. Onboarding completion rate >80% (vs current ~10% with auto-skip)
5. Layout provides clear visual hierarchy with ≤2 clicks to any feature

## Dependencies

- Current UI components (shadcn/ui)
- Existing onboarding/tutorial system
- Theme system (dark/light mode)
- Auto-save hooks

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Layout changes break existing functionality | Incremental migration with feature flags |
| Performance impact from animations | Use CSS transforms, lazy load tour system |
| Tooltip overload overwhelming users | Progressive disclosure, show only when needed |
| Breaking changes to component APIs | Maintain backward compatibility wrappers |

## Timeline Estimate

- **Phase 1** (Onboarding): 2-3 days
- **Phase 2** (Layout): 3-4 days
- **Phase 3** (Feedback): 2 days
- **Phase 4** (Polish): 1-2 days

**Total**: ~10 days

## Open Questions

1. Should we use an existing library for guided tours (react-joyride, intro.js) or build custom?
2. What's the preferred pattern for collapsible sidebars - hover or click?
3. Should keyboard shortcuts be configurable or hardcoded?
4. Do we need telemetry to track which tooltips are most helpful?
