# Tasks: Fix App Initialization Flow

**Change ID:** `fix-app-initialization-flow`
**Estimated Total:** 30 minutes

---

## Task Checklist

### 1. Implement Create Space Handler
**Estimated:** 10 minutes
**Assignee:** TBD
**Dependencies:** None

**Steps:**
1. Open `src/App.tsx`
2. Locate the "No Spaces Yet" conditional block (line ~49)
3. Add `handleCreateSpace` function inside the conditional:
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
4. Add `onClick={handleCreateSpace}` to button element
5. Save file

**Validation:**
- TypeScript compiles without errors
- ESLint shows no warnings
- Hot reload updates the app

---

### 2. Manual Testing
**Estimated:** 10 minutes
**Assignee:** TBD
**Dependencies:** Task 1

**Test Cases:**
1. **Fresh Install Flow:**
   - Clear localStorage: `localStorage.clear()`
   - Reload app
   - Complete/skip onboarding
   - Click "Create Space"
   - Verify: SpaceContainer loads with Pixi.js canvas

2. **Persistence Flow:**
   - Create space (from test 1)
   - Close Tauri app completely
   - Reopen app
   - Verify: SpaceContainer loads immediately
   - Verify: No "No Spaces Yet" screen

3. **Console Check:**
   - Open DevTools console
   - Create space
   - Verify: No errors or warnings

**Validation:**
- All 3 test cases pass
- Screenshots/screen recording captured

---

### 3. Code Review
**Estimated:** 5 minutes
**Assignee:** TBD
**Dependencies:** Tasks 1-2

**Review Checklist:**
- [ ] Code follows existing `App.tsx` patterns
- [ ] Uses shadcn/ui button classes
- [ ] No new dependencies added
- [ ] TypeScript types are correct
- [ ] Function is properly scoped (inside conditional)
- [ ] Space configuration matches spec defaults

**Validation:**
- Review approved by team member OR self-review documented

---

### 4. Commit and Archive
**Estimated:** 5 minutes
**Assignee:** TBD
**Dependencies:** Tasks 1-3

**Steps:**
1. Stage changes: `git add src/App.tsx`
2. Commit with OpenSpec reference:
   ```bash
   git commit -m "fix(app): implement Create Space button functionality

   Implements fix-app-initialization-flow OpenSpec change.

   - Add handleCreateSpace onClick handler to Create Space button
   - Create default space with standard configuration
   - Enable users to access 2D workspace from empty state

   Closes: openspec/changes/fix-app-initialization-flow
   Refs: REQ-STARTUP-001, REQ-STARTUP-002"
   ```
3. Push to GitHub
4. Run: `/openspec:archive fix-app-initialization-flow`

**Validation:**
- Commit pushed successfully
- OpenSpec change archived
- GitHub issue closed (if exists)

---

## Rollback Plan

**If issues arise:**
1. Revert commit: `git revert HEAD`
2. Push revert
3. File bug report in GitHub Issues
4. Create new OpenSpec change proposal

**Low Risk:** Single file change, easy to revert.

---

## Success Metrics

**Definition of Done:**
- [x] "Create Space" button creates a space
- [x] SpaceContainer loads with Pixi.js
- [x] Space persists across restarts
- [x] No console errors
- [x] Code reviewed and approved
- [x] Changes committed with OpenSpec reference
- [x] Change archived

**User Outcome:**
Users can now complete the full MVP flow from app launch to active 2D workspace.
