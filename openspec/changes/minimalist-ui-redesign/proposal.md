# Minimalist UI Redesign Proposal

**Change ID**: `minimalist-ui-redesign`
**Date**: November 10, 2025
**Status**: Proposal
**Priority**: High
**Epic**: UX/UI Improvements

## Problem Statement

The current UI has invasive transparency layers and complex visual hierarchies that reduce functionality and make the interface harder to use. The design needs to be simplified to:

- Remove invasive transparent overlays
- Maintain 100% functionality
- Create a clean, minimalist aesthetic
- Improve accessibility and readability
- Make the interface more dynamic and responsive

## Goals

1. **Minimalist Design**: Remove unnecessary visual elements while preserving all features
2. **Zero Transparency**: Use solid colors and clear visual boundaries
3. **Full Functionality**: Every feature must work as designed, no degradation
4. **Responsive Layout**: UI adapts intelligently to content and user actions
5. **Dynamic Interactions**: Smooth transitions and animations

## Scope

### In Scope

- **Zero Hardcoding**: Create fully dynamic configuration system (no hardcoded values)
- Redesign all UI panels (left sidebar, right sidebar, status bar, dialogs)
- Create minimalist component library using Tailwind + shadcn/ui
- Implement clean theme system (light/dark modes)
- Update layout containers for better space usage
- Create minimalist mission display system
- Redesign agent management interface
- Configuration-driven architecture (theme, layout, animations, UI)
- Dynamic component rendering from configuration
- Runtime theme switching and user preferences

### Out of Scope

- Game mechanics changes
- Collision detection system redesign
- Network/sync functionality changes
- Asset/sprite changes

## Key Changes

### 1. **UI Components** (`ui-components/spec.md`)

- Minimalist button styles (no shadow, solid colors)
- Clean panel design (border-based instead of shadow-based)
- Readable text with proper contrast
- Compact form inputs
- Icon-only or minimal text buttons

### 2. **Layout System** (`layout-system/spec.md`)

- Single-column responsive design for sidebars
- Collapsible sections for density
- Intelligent space allocation
- Dock-based positioning for quick access
- Full-screen game canvas as primary focus

### 3. **Theme System** (`theme-system/spec.md`)

- Solid color palette (no gradients/transparency)
- High contrast for accessibility
- Dark/light mode support
- Consistent spacing and sizing
- Brand colors with clear semantic meaning

## Success Criteria

- [ ] All UI panels rebuild with minimalist design
- [ ] Zero transparency in main UI
- [ ] All 7 missions display and update correctly
- [ ] Agent management fully functional
- [ ] Game canvas remains primary focus
- [ ] No performance degradation
- [ ] Accessibility WCAG AA compliant
- [ ] All tests passing

## Dependencies

- Existing React component structure
- Tailwind CSS v4 configuration
- shadcn/ui component library
- Zustand state management (no changes)

## Related Specs

- `openspec/specs/00-project-overview.md` - Project context
- `openspec/specs/02-user-flows.md` - User interaction flows
- `openspec/specs/03-data-models.md` - Data structures

## Implementation Timeline

**Phase 1**: Design system and components (2-3 days)
**Phase 2**: Layout redesign and panels (2-3 days)
**Phase 3**: Functional testing and refinement (1-2 days)
**Phase 4**: Performance optimization and polish (1 day)

## Risks & Mitigations

| Risk                             | Likelihood | Impact | Mitigation                       |
| -------------------------------- | ---------- | ------ | -------------------------------- |
| Reduced visual feedback          | Medium     | Medium | Animations and color transitions |
| Layout overflow on small screens | Low        | Medium | Mobile-first responsive design   |
| Mission tracking visibility      | Low        | Medium | Smart collapsible sections       |
| Performance impact               | Low        | Low    | Component memoization            |

## Questions for Clarification

1. Should we keep dark theme as default or switch to light?
2. Are there specific color preferences for the minimalist palette?
3. Should agent panel auto-collapse when not in use?
4. What's the minimum screen size we need to support?

## Next Steps

1. Review and approve this proposal
2. Create detailed specs in `specs/*/spec.md`
3. Create implementation tasks in `tasks.md`
4. Begin Phase 1 design work
5. Validate against accessibility standards
