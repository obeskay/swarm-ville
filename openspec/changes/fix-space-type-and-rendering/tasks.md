# Tasks: Fix Space Type and Rendering

**Change ID:** `fix-space-type-and-rendering`
**Total Time:** 15 minutes

## Task 1: Fix Space Creation Object
**Time:** 5 minutes
**Dependencies:** None

**Steps:**
1. Open `src/App.tsx`
2. Find `handleCreateSpace` function (line ~49)
3. Replace space creation object with:
```typescript
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
4. Save file

**Validation:**
- [ ] TypeScript compiles: `npm run type-check`
- [ ] No TS errors
- [ ] Hot reload updates app

## Task 2: Manual Testing
**Time:** 8 minutes
**Dependencies:** Task 1

**Test Flow:**
1. Clear localStorage: Open DevTools → Console → `localStorage.clear()` → Reload
2. Skip/complete onboarding
3. Click "Create Space"
4. **Verify:** Canvas shows grid pattern
5. **Verify:** Blue circle (user avatar) visible
6. **Verify:** Click canvas → avatar moves
7. **Verify:** No console errors

**Evidence:**
- [ ] Screenshot of working grid
- [ ] Screenshot of user avatar
- [ ] Movement works

## Task 3: Commit
**Time:** 2 minutes
**Dependencies:** Tasks 1-2

```bash
git add src/App.tsx
git commit -m "fix(space): correct Space object structure for Pixi.js rendering

Implements fix-space-type-and-rendering OpenSpec change.

- Use dimensions: { width, height } nested structure
- Add ownerId and tileset fields
- Use number timestamps (Date.now())
- Fixes Pixi.js canvas rendering

Closes: openspec/changes/fix-space-type-and-rendering
Refs: REQ-SPACE-001, REQ-SPACE-002"
```

**Validation:**
- [ ] Commit pushed
- [ ] Change ready for archive

## Success Criteria

- [x] Space creation matches `Space` type
- [ ] Pixi.js canvas renders
- [ ] Grid visible
- [ ] User avatar visible
- [ ] Movement works
- [ ] No errors
