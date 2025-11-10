# Proposal: Fix Critical UI and Integration Issues

## Why

The MVP cannot function without these fixes. Users cannot interact with the core spatial workspace, create agents through the UI, or communicate with agents. These three issues block all primary use cases and must be resolved before any user testing can occur.

## What Changes

This change fixes three critical bugs:

1. **Canvas Rendering (Capability: `canvas-rendering`)**: Add loading state to `usePixiApp` hook to ensure Pixi.js initializes before rendering canvas content. Modify `SpaceContainer` to display loading indicator.

2. **Dialog Interactivity (Capability: `dialog-interactivity`)**: Add `pointer-events: auto` to `.spawner-overlay` and verify `.agent-dialog-overlay` has the same fix. This allows users to click on dialog inputs/buttons.

3. **CLI Integration (Capability: `cli-integration`)**: Change Claude CLI command from invalid `claude --prompt "..."` to correct `echo "..." | claude` with proper escaping, timeout handling, and error messages.

**Files Modified:**

- `src/hooks/usePixiApp.ts` - Add `isLoading` and `error` state
- `src/components/space/SpaceContainer.tsx` - Add loading/error UI
- `src/components/agents/AgentSpawner.css` - Add `pointer-events: auto`
- `src/components/agents/AgentDialog.css` - Verify `pointer-events: auto`
- `src-tauri/src/cli/mod.rs` - Fix command execution logic

## Problem Statement

Three critical issues are preventing SwarmVille from functioning correctly:

1. **Canvas Not Rendering**: The Pixi.js canvas shows a solid gray background instead of the interactive grid workspace
2. **Dialog Not Interactive**: The "Spawn New Agent" dialog is visible but users cannot click on input fields or buttons
3. **Claude CLI Integration Broken**: Agent chat integration fails with "Unknown error" due to incorrect CLI command structure

## User Impact

- **High**: Users cannot see or interact with the spatial workspace (core feature)
- **High**: Users cannot create new agents through the UI
- **High**: Users cannot communicate with agents even if created programmatically

## Affected Components

- `src/hooks/usePixiApp.ts` - Pixi.js initialization
- `src/components/space/SpaceContainer.tsx` - Canvas rendering
- `src/components/agents/AgentSpawner.css` - Dialog pointer events
- `src/components/agents/AgentDialog.css` - Dialog pointer events
- `src-tauri/src/cli/mod.rs` - Claude CLI execution

## Root Causes

### Issue 1: Canvas Not Rendering

The `usePixiApp` hook initializes Pixi.js asynchronously, but `SpaceContainer` checks for `app/stage/viewport` being non-null before rendering. Since these are `null` during initial render and the async initialization doesn't trigger a re-render reliably, the canvas never draws.

**Evidence**:

```typescript
// usePixiApp.ts:21
const initializePixi = async () => {
  const app = new PIXI.Application({...});
  setState({ app, stage, viewport }); // State update may not trigger re-render
}

// SpaceContainer.tsx:36
useEffect(() => {
  if (!space || !app || !stage || !viewport) return; // Always returns early
```

### Issue 2: Dialog Not Interactive

The parent `.space-ui` container has `pointer-events: none` to allow clicks to pass through to the canvas. However, child dialogs (`.spawner-overlay` and `.agent-dialog-overlay`) don't explicitly set `pointer-events: auto`, so they inherit the blocked state.

**Evidence**:

```css
/* SpaceUI.css:6 */
.space-ui {
  pointer-events: none; /* Blocks all descendant clicks */
}

/* AgentSpawner.css:1 - Missing pointer-events: auto */
.spawner-overlay {
  z-index: 300; /* High z-index but no pointer events */
}
```

### Issue 3: Claude CLI Integration Broken

The Rust backend attempts to call `claude --prompt "..."` but the Claude CLI doesn't support a `--prompt` flag. The correct usage is to pipe input via stdin or use the Anthropic API directly.

**Evidence**:

```rust
// src-tauri/src/cli/mod.rs:55-58
"claude" => Command::new("claude")
    .arg("--prompt")  // Invalid flag
    .arg(prompt)
    .output()
```

**Actual Claude CLI usage**:

```bash
# Correct:
echo "message" | claude

# Current (broken):
claude --prompt "message"  # No such flag
```

## Proposed Solution

### Fix 1: Add Loading State to Pixi.js Initialization

- Add `isLoading` state to `usePixiApp` hook
- Return loading indicator in `SpaceContainer` until Pixi is ready
- Ensure `setState` triggers re-render by using proper React state management

### Fix 2: Add Explicit Pointer Events to Dialogs

- Add `pointer-events: auto;` to `.spawner-overlay` class
- Add `pointer-events: auto;` to `.agent-dialog-overlay` class (verify if needed)
- Ensure all interactive overlays can receive clicks

### Fix 3: Fix Claude CLI Command Structure

- Change from `--prompt` flag to stdin pipe: `echo prompt | claude`
- Add error handling for empty responses
- Add timeout handling for long-running commands
- Consider fallback to API if CLI fails

## Success Criteria

- ✅ Canvas renders with visible grid pattern and user avatar
- ✅ User can click anywhere on canvas to move avatar
- ✅ "Spawn New Agent" dialog accepts keyboard and mouse input
- ✅ Agent chat successfully sends messages to Claude CLI
- ✅ Error messages are clear when CLI is not installed

## Scope Limitations

- **Out of scope**: Optimizing Pixi.js rendering performance
- **Out of scope**: Adding support for other AI CLIs (focus on Claude first)
- **Out of scope**: UI/UX improvements beyond functionality fixes
- **Out of scope**: Adding tests (will be separate change)

## Dependencies

- Requires `fix-space-type-and-rendering` to be completed first (already applied)
- No new external dependencies

## Risks

- **Low risk**: Changes are isolated to specific components
- **Low risk**: CSS changes are additive (no breaking changes)
- **Medium risk**: CLI command change may behave differently across platforms (needs testing on macOS/Linux/Windows)

## Alternatives Considered

### Alternative 1: Use Anthropic API directly instead of CLI

**Pros**: More reliable, better error handling, typed responses
**Cons**: Requires API key management, adds complexity
**Decision**: Keep CLI approach for MVP, consider API for Phase 11

### Alternative 2: Synchronous Pixi.js initialization

**Pros**: Simpler code flow
**Cons**: Blocks main thread, poor UX
**Decision**: Keep async but add loading state

## Related Changes

- Completes work started in `fix-space-type-and-rendering`
- Enables future work on agent communication (Phase 5)
- Unblocks UI consistency improvements
