# Initialize Player Stats on App Load

## Why
Currently, player stats (level, XP, balance, missions) are hardcoded with default values in the userStore. There's no proper initialization flow when the app loads, which means:
- New users always start with arbitrary values (level 4, 75 XP, $10 balance)
- There's no distinction between first-time users and returning users
- Stats should be properly initialized from Tauri backend or localStorage
- No validation that persisted stats are valid

## What Changes
Implement a proper player stats initialization system that:
1. Checks if the user is new (first load) or returning (has persisted data)
2. For new users: Initialize with proper starting values (level 1, 0 XP, starting balance)
3. For returning users: Load and validate persisted stats
4. Integrate with Tauri backend to persist stats to database
5. Add a `initializePlayerStats` action to userStore

## Scope
This change affects:
- `src/stores/userStore.ts` - Add initialization logic
- `src/App.tsx` - Call initialization on app load
- Potentially `src-tauri/src/commands/` - Backend persistence (future)

## Success Criteria
- [ ] New users start with level 1, 0 XP, and defined starting balance
- [ ] Returning users load their saved stats correctly
- [ ] Stats persist between app restarts
- [ ] Invalid or corrupted stats are reset to defaults with warning
- [ ] Initialization happens before UI renders

## Related Changes
None yet - this is FASE 1.3 of progression system implementation
