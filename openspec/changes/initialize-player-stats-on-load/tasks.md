# Implementation Tasks

## Phase 1: Core Initialization Logic
- [ ] **Task 1.1**: Add `isInitialized` flag to userStore state
  - Add boolean flag to track initialization status
  - Default to `false`
  - **Validation**: State includes `isInitialized` field

- [ ] **Task 1.2**: Create `initializePlayerStats()` action in userStore
  - Check if persisted data exists (via Zustand persist)
  - If new user: set level=1, xp=0, balance=50.0, missions with progress=0
  - If returning: validate and load existing stats
  - Set `isInitialized` to `true`
  - **Validation**: Action correctly handles both new and returning users

- [ ] **Task 1.3**: Add data validation helper
  - Create `validateUserStats()` function
  - Check all required fields exist
  - Verify values are in valid ranges
  - Return `true` if valid, `false` if invalid
  - **Validation**: Function catches corrupted data

## Phase 2: Integration with App Component
- [ ] **Task 2.1**: Call `initializePlayerStats()` in App.tsx
  - Add call in `useEffect` after Tauri init
  - Ensure it runs before space creation
  - **Validation**: Initialization happens on every app load

- [ ] **Task 2.2**: Add initialization loading state
  - Show loading UI while `isInitialized` is `false`
  - Hide main UI until initialization completes
  - **Validation**: No flash of uninitialized data

- [ ] **Task 2.3**: Handle initialization errors
  - Wrap initialization in try-catch
  - Log errors to console
  - Fall back to defaults if init fails
  - **Validation**: App doesn't crash on init errors

## Phase 3: Default Values Update
- [ ] **Task 3.1**: Fix default mission progress values
  - Set all mission `progress` to 0 in `defaultMissions`
  - Keep first mission ("first-steps") as active
  - **Validation**: New users see all missions at 0 progress

- [ ] **Task 3.2**: Update starting balance
  - Change default balance from 10.0 to 50.0
  - Document as "starting bonus"
  - **Validation**: New users start with $50.00

## Phase 4: Testing & Validation
- [ ] **Task 4.1**: Test new user flow
  - Clear localStorage
  - Start app
  - Verify stats: level=1, xp=0, balance=50.0
  - **Validation**: Manual test passes

- [ ] **Task 4.2**: Test returning user flow
  - Start app with existing data
  - Verify persisted stats load correctly
  - Make changes, restart, verify persistence
  - **Validation**: Manual test passes

- [ ] **Task 4.3**: Test corrupted data recovery
  - Manually corrupt localStorage data
  - Start app
  - Verify graceful fallback to defaults
  - **Validation**: App recovers without crash

## Dependencies
- No external dependencies
- All tasks can proceed sequentially

## Parallel Work Opportunities
- Tasks 3.1 and 3.2 (default values) can be done in parallel with Phase 2
- Testing (Phase 4) should wait until all implementation is complete
