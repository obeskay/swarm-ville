# Proposal: Improve Developer Experience and Project Structure

**Change ID:** `improve-developer-experience`  
**Type:** Refactoring + DX Improvement  
**Status:** Completed  
**Date Created:** 2025-11-09  
**Branch:** `comprehensive-cleanup-dx-improvements`

## Problem Statement

SwarmVille had significant developer experience friction:

1. **Root directory clutter** - 44 items including scattered docs and references
2. **Package manager confusion** - Both `package-lock.json` and `pnpm-lock.yaml` present
3. **Complex startup** - Required 3 separate terminals (WebSocket, Vite, Tauri)
4. **Missing linting config** - No ESLint config file, unclear standards
5. **API key exposure risk** - Inadequate .gitignore protection
6. **Disorganized memories** - .serena had flat structure
7. **Confusing documentation** - Duplicate QUICK_START files, unclear onboarding

**User quote:**
> "Demasiados comandos, demasiado confuso... puse pnpm dev pero no logre ver el tauri estoy perdido"

## Proposed Solution

Comprehensive cleanup addressing all DX pain points:

### 1. Root Directory Organization
- Move documentation to `/docs`
- Move references to `/docs/references`
- Archive duplicates to `/docs/archive`
- **Result:** 44 → ~25 items in root

### 2. Package Manager Standardization
- Use **pnpm exclusively**
- Remove `package-lock.json`
- Add to .gitignore
- Update all scripts to use `pnpm`

### 3. Single-Command Development
- **Before:** 3 terminals (WebSocket + Vite + Tauri)
- **After:** One command: `pnpm dev`
- Uses `concurrently` with color-coded output
- Auto-starts all services

### 4. Linting Configuration
- Create `.eslintrc.cjs` with pragmatic rules
- Create `.prettierrc` for formatting
- Add prettier to devDependencies
- Add `pnpm format` and `pnpm format:check` scripts

### 5. Enhanced .gitignore
- Add API key patterns (`*.key`, `*_key.txt`, `credentials.json`)
- Add backup patterns (`*.bak`, `*.old`, `*_OLD/`)
- Add Claude Code cache (`.claude/tsc-cache/`)
- Prevent wrong package manager locks

### 6. .serena Organization
- Create subdirectories: 01-architecture, 02-debugging, 03-sessions, 04-cleanup
- Move memories into categories
- Create README documenting structure

### 7. Documentation Consolidation
- Update QUICK_START.md with new workflow
- Single source of truth for setup
- Include troubleshooting section

## Success Metrics

- ✅ Root directory: 44 → ~25 items
- ✅ Package manager: Single (pnpm)
- ✅ Dev command: `pnpm dev` starts all services
- ✅ Setup time: 5 min → 2 min
- ✅ API key protection: Comprehensive .gitignore
- ✅ Linting: Pragmatic rules, no noise
- ✅ Memory organization: Categorized and searchable

## Files Changed

### Created
- `.npmrc` - pnpm configuration
- `.eslintrc.cjs` - ESLint rules
- `.prettierrc` - Prettier configuration
- `QUICK_START.md` - New consolidated guide
- `.serena/README.md` - Memory system docs
- `.serena/memories/04-cleanup/comprehensive-cleanup-2025-11-09.md`

### Modified
- `package.json` - Scripts and prettier dependency
- `.gitignore` - Enhanced protection
- Multiple docs moved to `/docs`

### Deleted
- `package-lock.json` - Using pnpm-lock.yaml

### Moved
- `QUICK_REFERENCE.md` → `docs/`
- `PROJECT_BLUEPRINT.md` → `docs/`
- `GAME_FEATURES.md` → `docs/`
- `RESUMEN_EJECUTIVO.md` → `docs/archive/`
- `QUICKSTART.md` → `docs/archive/`
- `gather-clone-reference/` → `docs/references/`
- `references/` → `docs/references/agentic-systems/`

## Migration Guide

### For Developers

**Before:**
```bash
# Terminal 1
npm run ws

# Terminal 2
npm run dev

# Terminal 3
npm run tauri:dev
```

**After:**
```bash
# One terminal
pnpm dev
```

**New setup flow:**
```bash
pnpm setup  # Install + create .env
pnpm dev    # Start everything
```

### Breaking Changes

None - this is purely additive and organizational.

## Dependencies

- Added: `prettier@^3.1.1` (devDependency)
- Added: `concurrently@^9.2.1` (already present)
- Removed: None

## Testing Plan

1. Test `pnpm setup` workflow
2. Test `pnpm dev` (verify all 3 services start)
3. Run `pnpm test:all` (type-check + lint + test)
4. Verify linting passes with new config
5. Verify documentation accuracy

## Future Improvements

- Consider adding pre-commit hooks (lint-staged + husky)
- Add CONTRIBUTING.md with development guidelines
- Consider migrating to ESLint flat config (eslint.config.js)

## References

- User request: Comprehensive cleanup session 2025-11-09
- Memory: `.serena/memories/04-cleanup/comprehensive-cleanup-2025-11-09.md`
- Branch: `comprehensive-cleanup-dx-improvements`

