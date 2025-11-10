# Canvas Rendering Capability

**Capability ID:** `canvas-rendering`
**Domain:** User Interface
**Status:** Modified

## Overview

This capability ensures the Pixi.js canvas initializes properly and displays the interactive 2D workspace with grid and user avatar.

---

## ADDED Requirements

### REQ-CANVAS-001: Pixi.js Initialization Loading State

**Priority:** Critical
**Rationale:** Prevent rendering errors by ensuring Pixi.js is fully initialized before displaying canvas content.

The Pixi.js canvas initialization must provide a loading state to prevent rendering before the app is ready.

#### Scenario: User creates first space and sees loading indicator

**Given** a user has completed onboarding
**When** they create their first space
**Then** a loading indicator appears with message "Initializing workspace..."
**And** a spinning animation is visible
**And** the loading indicator disappears when initialization completes
**And** the canvas with grid becomes visible

#### Scenario: Canvas renders successfully after loading

**Given** Pixi.js has initialized successfully
**When** the canvas is displayed
**Then** a grid pattern with 32x32px tiles is visible
**And** the grid covers the entire canvas area
**And** the user avatar (blue circle) is visible on the grid
**And** canvas responds to mouse clicks

---

### REQ-CANVAS-002: Error Handling for Failed Initialization

**Priority:** High
**Rationale:** Provide clear feedback when technical issues prevent canvas rendering.

The system must handle Pixi.js initialization failures gracefully.

#### Scenario: Pixi.js fails to initialize

**Given** Pixi.js initialization encounters an error
**When** the error occurs
**Then** an error message is logged to browser console with full stack trace
**And** a user-friendly error message is displayed: "Cannot initialize workspace"
**And** a "Retry" button is provided

#### Scenario: User retries after initialization failure

**Given** Pixi.js initialization failed
**When** user clicks "Retry" button
**Then** the initialization process runs again
**And** if successful, canvas renders normally
**And** if failed again, error message persists with suggestion to refresh page

---

## Implementation Notes

**Files to Modify:**

- `src/hooks/usePixiApp.ts` - Add `isLoading` and `error` state
- `src/components/space/SpaceContainer.tsx` - Add loading and error UI

**Code Pattern for usePixiApp.ts:**

```typescript
const [state, setState] = useState<
  PixiAppState & { isLoading: boolean; error: string | null }
>({
  app: null,
  stage: null,
  viewport: null,
  isLoading: true,
  error: null,
});

// After successful init:
setState({ app, stage, viewport, isLoading: false, error: null });

// On error:
setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
```

**Code Pattern for SpaceContainer.tsx:**

```typescript
const { app, stage, viewport, isLoading, error } = usePixiApp(canvasRef);

if (isLoading) {
  return <div className="loading">Initializing workspace...</div>;
}

if (error) {
  return <div className="error">{error} <button onClick={retry}>Retry</button></div>;
}
```

## Related Requirements

- Depends on: REQ-STARTUP-001 (space must be created first)
- Depends on: REQ-SPACE-001 (space object structure)
- Enables: Future rendering optimizations

## Acceptance Criteria

- [ ] Loading indicator shows for ≤ 2 seconds on average hardware
- [ ] Canvas grid renders immediately after loading
- [ ] User avatar (blue circle) is visible
- [ ] Clicking canvas moves avatar (verifies interactivity)
- [ ] Error message appears if Pixi.js fails to initialize
- [ ] Retry button re-attempts initialization
- [ ] No gray background flicker between states
