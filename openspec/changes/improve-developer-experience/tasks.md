# Implementation Tasks: Improve Developer Experience

**Change ID:** `improve-developer-experience`  
**Status:** All tasks completed

## Phase 1: Root Directory Cleanup

- [x] Move `QUICK_REFERENCE.md` to `docs/`
- [x] Move `PROJECT_BLUEPRINT.md` to `docs/`
- [x] Move `GAME_FEATURES.md` to `docs/`
- [x] Move `RESUMEN_EJECUTIVO.md` to `docs/archive/`
- [x] Move `QUICKSTART.md` to `docs/archive/` (duplicate)
- [x] Move `gather-clone-reference/` to `docs/references/`
- [x] Move `references/` to `docs/references/agentic-systems/`
- [x] Delete `package-lock.json`
- [x] Verify root directory reduced from 44 → ~25 items

## Phase 2: Package Management Standardization

- [x] Create `.npmrc` with pnpm configuration
- [x] Update package.json scripts to use `pnpm` instead of `npm`
- [x] Remove `@anthropic-ai/claude-agent-sdk` dependency (using direct CLI)
- [x] Verify pnpm-lock.yaml is the only lock file

## Phase 3: Developer Experience - Single Command

- [x] Update `dev` script to run `dev:all`
- [x] Create `dev:all` script with concurrently
- [x] Configure color-coded output (cyan=WS, green=VITE, yellow=TAURI)
- [x] Add `setup` script for first-time setup
- [x] Add `setup:env` script to create .env from example
- [x] Add `clean` script for rebuilds
- [x] Test `pnpm dev` starts all 3 services

## Phase 4: CLI Integration

- [x] Verify CLI integration exists in `src-tauri/src/cli/`
- [x] Verify `detector.rs` detects installed CLIs
- [x] Verify `connector.rs` executes CLIs directly
- [x] Verify `types.rs` has proper type definitions
- [x] Verify Tauri commands are exposed
- [x] Verify frontend wrapper exists in `src/lib/cli.ts`

## Phase 5: Linting Configuration

- [x] Create `.eslintrc.cjs` with pragmatic rules
  - [x] TypeScript: `no-explicit-any` = warn
  - [x] Unused vars: Allow `_` prefix
  - [x] Console: Warn only
  - [x] Disable overly strict rules
- [x] Create `.prettierrc` for consistent formatting
- [x] Add prettier to devDependencies
- [x] Add `format` and `format:check` scripts

## Phase 6: Enhanced .gitignore

- [x] Add package manager locks to ignore (package-lock.json, yarn.lock)
- [x] Add API key patterns (*.key, *_key.txt, credentials.json, api_keys.json)
- [x] Add backup patterns (*.bak, *.old, *_OLD/, archive/, legacy/)
- [x] Add .claude/tsc-cache/
- [x] Add src-tauri/gen/

## Phase 7: .serena Reorganization

- [x] Create subdirectories: 01-architecture/, 02-debugging/, 03-sessions/, 04-cleanup/
- [x] Move pixi-optimization memories to 01-architecture/
- [x] Move black-canvas-debug memories to 02-debugging/
- [x] Move session memories to 03-sessions/
- [x] Create comprehensive-cleanup-2025-11-09.md in 04-cleanup/
- [x] Create .serena/README.md documenting structure

## Phase 8: Create OpenSpec Proposal

- [x] Create `openspec/changes/improve-developer-experience/` directory
- [x] Create `proposal.md` with comprehensive documentation
- [x] Create `tasks.md` with implementation checklist
- [x] Validate proposal structure

## Phase 9: Consolidate Documentation

- [x] Read existing QUICK_START.md
- [x] Create consolidated QUICK_START.md with:
  - [x] Prerequisites section
  - [x] Setup instructions
  - [x] Single-command workflow
  - [x] Troubleshooting section
  - [x] Optional CLI integration guide

## Phase 10: Testing and Commit

- [ ] Run `pnpm setup` to test setup workflow
- [ ] Run `pnpm dev` to verify all services start
- [ ] Check WebSocket (cyan), Vite (green), Tauri (yellow) logs
- [ ] Run `pnpm lint` to verify no errors
- [ ] Run `pnpm type-check` to verify TypeScript
- [ ] Create detailed commit message
- [ ] Push branch for review

## Validation Checklist

- [x] All phases 1-9 completed
- [ ] All services start with `pnpm dev`
- [ ] Linting passes without errors
- [ ] Documentation is accurate
- [ ] No API keys or sensitive data in git
- [ ] OpenSpec proposal is complete

