# Fix Space Type Mismatch and Pixi.js Rendering

**Change ID:** `fix-space-type-and-rendering`
**Status:** Proposed
**Created:** 2025-11-08
**Priority:** Critical

## Why

**Problem:**
User clicked "Create Space" and space was created, but Pixi.js canvas doesn't render. Investigation shows:

1. **Type Mismatch:** `App.tsx` creates space with flat `width/height` but `Space` type expects `dimensions: { width, height }`
2. **Missing Fields:** Space creation missing `ownerId`, using flat timestamps instead of numbers
3. **SpaceContainer fails silently:** When `space.dimensions` is undefined, Pixi.js initialization fails without error

**User Impact:**
- Canvas appears as blank gray area
- No 2D grid visible
- No agents render
- App appears broken after "Create Space"

**Root Cause:**
```typescript
// App.tsx creates (WRONG):
addSpace({
  id: crypto.randomUUID(),
  name: "Default Space",
  width: 1600,        // ❌ Should be dimensions.width
  height: 1200,       // ❌ Should be dimensions.height
  theme: "dark",
  gridSize: 32,
  createdAt: new Date(),  // ❌ Should be Date.now()
  updatedAt: new Date(),
});

// Space type expects (CORRECT):
interface Space {
  id: string;
  name: string;
  ownerId: string;      // ❌ Missing
  createdAt: number;    // ❌ Wrong type
  updatedAt: number;
  dimensions: {         // ❌ Wrong structure
    width: number;
    height: number;
  };
  // ...
}
```

## What Changes

Fix space creation in `App.tsx` to match `Space` interface:

```typescript
addSpace({
  id: crypto.randomUUID(),
  name: "Default Space",
  ownerId: "local-user",  // ✅ Add owner
  dimensions: {           // ✅ Nest dimensions
    width: 1600,
    height: 1200,
  },
  tileset: {              // ✅ Add required tileset
    tileSize: 32,
    theme: "dark",
  },
  createdAt: Date.now(),  // ✅ Use number
  updatedAt: Date.now(),
});
```

**Files Changed:**
- `src/App.tsx` - Fix space creation object

**No Type Changes:**
- `Space` interface is correct as-is
- All other components expect correct format

## Scope

**In Scope:**
- Fix space creation to match `Space` type
- Ensure Pixi.js canvas renders
- Verify grid and user avatar appear

**Out of Scope:**
- Agent spawning fixes (separate issue)
- CLI integration errors (separate issue)
- UI styling improvements (future OpenSpec)

## Impact

**User Impact:**
- ✅ Pixi.js canvas renders with grid
- ✅ User can see 2D workspace
- ✅ Foundation for agent interaction

**Technical Impact:**
- Minimal: 5 lines changed in `App.tsx`
- No type changes needed
- TypeScript will catch future errors

## Dependencies

**Blockers:** None
**Blocked By:** fix-app-initialization-flow (completed)
**Related:** Future agent CLI fixes

## Risks

**Low Risk:**
- Simple object structure fix
- TypeScript validates at compile time
- No runtime behavior changes beyond fixing bug

## Testing

**Manual:**
1. Create space
2. Verify Pixi.js canvas shows grid
3. Verify user avatar appears
4. Click canvas to test movement

**Validation:**
- `npm run type-check` passes
- No console errors
- Canvas renders correctly

## Timeline

**Effort:** 15 minutes
**Priority:** Critical - blocks all Pixi.js functionality
