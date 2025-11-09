# App Startup Capability

**Capability ID:** `app-startup`
**Domain:** User Interface
**Status:** Modified

## Overview

This capability defines how the SwarmVille desktop application initializes and transitions users from empty state to active workspace.

---

## MODIFIED Requirements

### REQ-STARTUP-001: Empty State Space Creation

**Priority:** Critical
**Rationale:** Users must be able to create their first space to access the 2D workspace.

When the application has completed onboarding but has no spaces:
- MUST display "No Spaces Yet" message
- MUST provide a "Create Space" button
- Button MUST create a default space when clicked
- App MUST transition to SpaceContainer after space creation

#### Scenario: User creates first space from empty state

**Given** user has completed onboarding
**And** no spaces exist in `useSpaceStore`
**When** user clicks "Create Space" button
**Then** a new space is created with default configuration:
- Unique ID (crypto.randomUUID())
- Name: "Default Space"
- Dimensions: 1600x1200
- Theme: "dark"
- Grid size: 32px
- Timestamps: current date/time

**And** `SpaceContainer` component renders
**And** Pixi.js canvas displays the 2D workspace

#### Scenario: Space persists across sessions

**Given** user created a space
**When** user closes and reopens the application
**Then** the space is still available in `useSpaceStore`
**And** user is taken directly to `SpaceContainer`
**And** no "No Spaces Yet" screen is shown

---

### REQ-STARTUP-002: UI Consistency

**Priority:** High
**Rationale:** Maintain consistent design system across the application.

The "Create Space" button:
- MUST use shadcn/ui styling classes
- MUST follow existing button pattern from App.tsx loading state
- MUST be visually consistent with onboarding wizard buttons

#### Scenario: Button styling matches design system

**Given** "No Spaces Yet" screen is displayed
**Then** "Create Space" button has classes:
- `px-6 py-2` (padding)
- `bg-primary text-primary-foreground` (colors)
- `rounded-lg` (border radius)
- `hover:bg-primary/90` (hover state)

---

## Implementation Notes

**Files to Modify:**
- `src/App.tsx` - Add onClick handler to "Create Space" button

**Code Pattern:**
```typescript
const handleCreateSpace = () => {
  const { addSpace } = useSpaceStore.getState();
  addSpace({
    id: crypto.randomUUID(),
    name: "Default Space",
    width: 1600,
    height: 1200,
    theme: "dark",
    gridSize: 32,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};
```

**State Management:**
- Uses existing `useSpaceStore.addSpace()` action
- Triggers React re-render via Zustand
- Persisted automatically via `zustand/middleware/persist`

**No Backend Changes:**
- Space data stored in browser localStorage
- Tauri backend `create_space` command NOT used (future enhancement)
- Database integration deferred to Phase 8 (Agent Memory)

## Related Requirements

- Phase 2: 2D Rendering - Defines SpaceContainer and Pixi.js integration
- Phase 3: Agent System - Space is prerequisite for agent spawning

## Acceptance Criteria

- [ ] "Create Space" button creates a space when clicked
- [ ] SpaceContainer renders with Pixi.js canvas
- [ ] Space persists across app restarts
- [ ] Button follows shadcn/ui design patterns
- [ ] No console errors during space creation
- [ ] Manual testing confirms full flow works
