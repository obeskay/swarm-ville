# Space Creation Capability

**Capability ID:** `space-creation`
**Domain:** Data Model
**Status:** Modified

## MODIFIED Requirements

### REQ-SPACE-001: Space Object Structure

**Priority:** Critical
**Rationale:** Space must match TypeScript interface for Pixi.js rendering to work.

When creating a new space:
- MUST include all required fields from `Space` interface
- MUST use `dimensions` object with `width` and `height`
- MUST use `tileset` object with `tileSize` and `theme`
- MUST use number timestamps (milliseconds since epoch)
- MUST include `ownerId` field

#### Scenario: Creating default space with correct structure

**Given** user clicks "Create Space" button
**When** `handleCreateSpace` executes
**Then** space object is created with structure:
```typescript
{
  id: string (UUID),
  name: "Default Space",
  ownerId: "local-user",
  dimensions: {
    width: 1600,
    height: 1200
  },
  tileset: {
    tileSize: 32,
    theme: "dark"
  },
  createdAt: number,
  updatedAt: number
}
```
**And** `SpaceContainer` can access `space.dimensions.width`
**And** Pixi.js initialization succeeds

### REQ-SPACE-002: Pixi.js Canvas Rendering

**Priority:** Critical
**Rationale:** Users must see the 2D workspace.

When `SpaceContainer` loads with valid space:
- MUST render Pixi.js canvas element
- MUST display grid based on `space.dimensions`
- MUST show user avatar at `userPosition`
- MUST NOT show console errors

#### Scenario: Canvas renders after space creation

**Given** space created with correct structure
**When** `SpaceContainer` mounts
**Then** Pixi.js canvas is visible
**And** grid lines render at 32px intervals
**And** user avatar appears as blue circle
**And** no console errors logged

## Implementation Notes

**Change Required:**
File: `src/App.tsx`, Function: `handleCreateSpace`

```typescript
// Before (BROKEN):
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

// After (FIXED):
addSpace({
  id: crypto.randomUUID(),
  name: "Default Space",
  ownerId: "local-user",
  dimensions: {
    width: 1600,
    height: 1200,
  },
  tileset: {
    tileSize: 32,
    theme: "dark",
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

**Type Reference:**
See `src/lib/types.ts` for `Space` interface definition.

## Acceptance Criteria

- [ ] Space created with correct `dimensions` structure
- [ ] Pixi.js canvas renders with visible grid
- [ ] User avatar appears on canvas
- [ ] TypeScript compile passes
- [ ] No console errors during rendering
- [ ] Manual test: click canvas to move avatar
