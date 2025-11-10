# Tasks: Fix Critical UI and Integration Issues

## Task Breakdown

### 1. Fix Canvas Rendering (Pixi.js Initialization)

**Priority**: Critical
**Estimated effort**: 30 minutes
**Dependencies**: None

**Steps**:

- [x] Add `isLoading` boolean to `usePixiApp` return type
- [x] Initialize `isLoading: true` in initial state
- [x] Set `isLoading: false` after successful Pixi.js initialization
- [x] Add loading indicator to `SpaceContainer` when `isLoading === true`
- [x] Add error state handling with error messages
- [x] Verify canvas renders after loading completes

**Validation**:

- Run Tauri app and verify loading spinner appears
- Verify canvas with grid appears after ~1 second
- Verify user avatar (blue circle) is visible
- Click on canvas and verify avatar moves

**Files affected**:

- `src/hooks/usePixiApp.ts` (modify return type and state)
- `src/components/space/SpaceContainer.tsx` (add loading UI)

---

### 2. Fix Dialog Pointer Events (Agent Spawner)

**Priority**: Critical
**Estimated effort**: 5 minutes
**Dependencies**: None

**Steps**:

- [ ] Add `pointer-events: auto;` to `.spawner-overlay` in `AgentSpawner.css`
- [ ] Verify `.agent-dialog-overlay` also has `pointer-events: auto;` (check if already present)
- [ ] Test clicking on input fields and buttons

**Validation**:

- Click "+ Add Agent" button
- Verify dialog appears
- Click on "Agent Name" input field and type
- Verify text appears
- Click on "Role" dropdown and select option
- Click "Spawn Agent" button and verify agent is created

**Files affected**:

- `src/components/agents/AgentSpawner.css` (add 1 line)
- `src/components/agents/AgentDialog.css` (verify existing line)

---

### 3. Fix Claude CLI Command Structure

**Priority**: Critical
**Estimated effort**: 45 minutes
**Dependencies**: None

**Steps**:

- [ ] Change `execute_cli_command` to use stdin pipe instead of `--prompt` flag
- [ ] Update command execution to: `echo "{prompt}" | claude`
- [ ] Add timeout handling (30 seconds default)
- [ ] Add error handling for empty responses
- [ ] Add error handling for command not found
- [ ] Test with actual Claude CLI installation

**Validation**:

- Create an agent via UI
- Click on agent in sidebar
- Type "Hello, who are you?" in chat
- Press Enter
- Verify response appears from Claude
- Verify error message is clear if Claude CLI not installed

**Files affected**:

- `src-tauri/src/cli/mod.rs` (modify `execute_cli_command` function)

---

### 4. Manual End-to-End Testing

**Priority**: High
**Estimated effort**: 20 minutes
**Dependencies**: Tasks 1, 2, 3

**Steps**:

- [ ] Run `npm run dev` (Vite)
- [ ] Run `npm run tauri dev` (Tauri)
- [ ] Complete onboarding flow
- [ ] Create first space
- [ ] Verify canvas renders with grid
- [ ] Click on canvas to move avatar
- [ ] Click "+ Add Agent" button
- [ ] Fill in agent details and create
- [ ] Click on agent in sidebar
- [ ] Send message to agent
- [ ] Verify response appears

**Validation**:

- All UI elements are interactive
- Canvas renders correctly
- Agent communication works
- No console errors

**Files affected**: None (testing only)

---

## Rollback Plan

If any task fails:

1. **Canvas rendering fails**: Revert `usePixiApp.ts` and `SpaceContainer.tsx` changes
2. **Dialog still not interactive**: Check browser DevTools for z-index conflicts
3. **CLI command fails**:
   - Check Claude CLI installation: `which claude`
   - Test command manually: `echo "test" | claude`
   - Check Tauri logs: `tail -f /tmp/tauri-debug.log`

## Notes

- Task 1 and Task 2 can be done in parallel
- Task 3 requires Claude CLI to be installed for full validation
- All tasks should be completed in a single session to avoid partial state
