# Design: Player Stats Initialization System

## Overview
This design implements a robust initialization system for player stats that handles both new and returning users, validates data integrity, and ensures proper sequencing with app startup.

## Architecture

### Component Interaction
```
App.tsx (startup)
    ↓
useEffect (after Tauri init)
    ↓
userStore.initializePlayerStats()
    ↓
Check Zustand persist storage
    ↓
┌─────────────┬──────────────┐
│  New User   │ Returning User│
└─────────────┴──────────────┘
      ↓              ↓
Set defaults   Validate data
      ↓              ↓
      └──────┬───────┘
             ↓
    Set isInitialized = true
             ↓
     UI renders stats
```

### Data Flow

1. **App Startup**
   - Tauri backend initializes
   - Database connection established
   - User stats initialization triggered

2. **Initialization Logic**
   ```typescript
   if (no persisted data) {
     // New user path
     initializeDefaults();
   } else {
     // Returning user path
     if (validatePersistedData()) {
       loadPersistedData();
     } else {
       logWarning();
       initializeDefaults();
     }
   }
   setInitialized(true);
   ```

3. **UI Rendering**
   - Components check `isInitialized` flag
   - Show loading state while `false`
   - Render actual stats when `true`

## Key Design Decisions

### Decision 1: Use Zustand Persist Instead of Tauri Commands
**Rationale**: Zustand persist provides automatic localStorage sync with minimal code. Tauri backend persistence can be added later for cloud sync.

**Trade-offs**:
- ✅ Pro: Simpler implementation, fewer moving parts
- ✅ Pro: Works immediately without backend changes
- ⚠️ Con: Limited to local storage (no cloud sync)
- ⚠️ Con: Data not encrypted

**Future**: Can add Tauri backend as secondary persistence layer.

### Decision 2: Validate on Load, Not on Save
**Rationale**: Validation on load catches corruption from external modifications or version migrations.

**Trade-offs**:
- ✅ Pro: Protects against all sources of corruption
- ✅ Pro: Simpler save logic
- ⚠️ Con: Invalid saves aren't caught immediately

### Decision 3: Graceful Degradation for Invalid Data
**Rationale**: Better UX to reset to defaults than to crash or show errors.

**Trade-offs**:
- ✅ Pro: App never crashes from bad data
- ✅ Pro: Users can continue playing
- ⚠️ Con: Users lose progress if data corrupts
- ⚠️ Con: Silent failures might hide bugs

**Mitigation**: Log warnings to console for debugging.

### Decision 4: Block UI Until Initialized
**Rationale**: Prevents race conditions where UI tries to render stats before they're loaded.

**Trade-offs**:
- ✅ Pro: No undefined or incorrect values displayed
- ✅ Pro: Simpler component logic (no null checks)
- ⚠️ Con: Slight delay before UI appears

**Mitigation**: Initialization is fast (<50ms), delay barely noticeable.

## Data Structure

### User Stats Schema
```typescript
interface UserStats {
  level: number;        // >= 1
  xp: number;          // >= 0
  balance: number;     // >= 0
  missions: Mission[]; // Array of mission objects
  isInitialized?: boolean; // Internal flag
}
```

### Validation Rules
- `level`: Must be integer >= 1
- `xp`: Must be number >= 0
- `balance`: Must be number >= 0
- `missions`: Must be array with at least 1 item
- Each mission must have required fields: id, title, progress, total, etc.

## Error Handling

### Scenario: localStorage Unavailable
```typescript
try {
  // Load from persist
} catch (e) {
  console.error('localStorage unavailable:', e);
  // Continue with defaults (no persistence)
}
```

### Scenario: Corrupted Data
```typescript
if (!validateUserStats(data)) {
  console.warn('Corrupted user data detected, resetting to defaults');
  return getDefaultStats();
}
```

### Scenario: Missing Fields After Version Update
```typescript
const stats = {
  ...getDefaultStats(),
  ...loadedData, // Overlay loaded data
};
// Missing fields filled with defaults
```

## Testing Strategy

### Unit Tests (Future)
- Test `validateUserStats()` with various invalid inputs
- Test `initializePlayerStats()` with/without persisted data
- Test default values are correct

### Integration Tests (Manual)
- Clear localStorage → start app → verify defaults
- Save progress → restart → verify persistence
- Corrupt localStorage → restart → verify recovery

### Edge Cases
- Empty localStorage
- Partially written data (interrupted save)
- Data from future app version (forward compatibility)
- Very large numbers (overflow checking)

## Migration Path

### Current State
- Hardcoded defaults in store initialization
- No distinction between new/returning users
- No validation

### Target State
- Explicit initialization function
- New user defaults: level 1, xp 0, balance 50
- Returning users: load & validate persisted data
- Initialization flag prevents premature rendering

### Future Enhancements
1. **Cloud Sync**: Add Tauri backend persistence
2. **Encryption**: Encrypt sensitive data (balance)
3. **Backup**: Auto-backup before resets
4. **Analytics**: Track initialization success rate
5. **Migration System**: Handle schema changes between versions

## Performance Considerations

- Initialization is synchronous and fast (<10ms typical)
- No network calls (all local)
- Single localStorage read
- Minimal CPU for validation
- No blocking operations

## Security Considerations

- Data stored in localStorage (unencrypted)
- No sensitive personal information
- Balance can be manually edited (client-side only)
- Future: Server validation for multiplayer features

## Backwards Compatibility

- Existing users with hardcoded values will be treated as "returning"
- Their persisted data will be validated and used
- No data migration needed for this change
- Future schema changes will require migration logic
