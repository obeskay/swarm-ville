# Space Versioning - Technical Design

## Context

SwarmVille is a real-time collaborative workspace system where multiple users interact in shared 2D spaces. Currently, there's no mechanism to detect when space state changes, making it impossible to implement conflict resolution or optimize sync patterns. This design introduces versioning to enable these capabilities.

## Goals

- **Primary**: Enable change detection and conflict resolution for space state
- **Secondary**: Support optimistic updates with server reconciliation
- **Non-Goal**: Implement full CRDT (conflicts are rare; last-write-wins is acceptable)

## Architecture

### Version Lifecycle

```
User creates space
    ↓
version = 1, updatedAt = now()
    ↓
User modifies space (agents added, tile changed, etc)
    ↓
version++, updatedAt = now(), broadcast to clients
    ↓
Clients receive update → updateSpaceVersion(spaceId, newVersion)
    ↓
UI displays "s1" → "s2" → "s3" etc
```

### Storage

**Frontend (Zustand Store)**:
```typescript
// In Space object
version: number;        // Current version
updatedAt: number;      // Timestamp of last update (ms)
```

**Backend (SQLite)**:
```sql
-- spaces table (Rust)
CREATE TABLE spaces (
    id TEXT PRIMARY KEY,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL,
    -- other fields...
);
```

### WebSocket Protocol

**space_state message** (sent on join):
```typescript
{
    type: "space_state",
    space_id: string,
    users: UserState[],
    version: number  // ← NEW: Include current version
}
```

**space_updated message** (sent on modification):
```typescript
{
    type: "space_updated",
    space_id: string,
    version: number,
    updated_at: number,
    // Optional: which property changed
    changed?: "agents" | "tilemap" | "settings"
}
```

### Conflict Resolution (Future Implementation)

When client tries to update:
1. Send: `{ version: 2, newData: {...} }`
2. Server checks: `client_version == server_version`
3. If match: increment and broadcast
4. If mismatch: reject with `{ type: "version_conflict", current_version: 3 }`
5. Client retries with latest version

## Decisions

### Why Frontend Version Display?

**Decision**: Show space version (`s1`, `s2`) in TopToolbar UI

**Rationale**:
- Visual feedback that system is tracking changes
- Helps debug sync issues ("what version did you have?")
- Matches gather-clone patterns (visible state)

**Alternative Considered**: Hide version internally
- Rejected: Loses transparency, harder to debug

### Why Atomic Increment?

**Decision**: Backend MUST increment version before broadcasting

**Rationale**:
- Prevents gaps in version numbers (easier debugging)
- Ensures all clients see monotonic versioning
- Simplifies conflict detection logic

**Alternative**: Version = hash(state)
- Rejected: More complex, no benefit for this use case

### Why UpdatedAt Timestamp?

**Decision**: Track both version AND timestamp

**Rationale**:
- Version: tracks # of changes (simple integer)
- Timestamp: tracks WHEN change occurred (useful for sorting/debugging)
- Together: support audit logs and time-based queries

## Implementation Notes

### Frontend (100% Complete)

✅ **Types** (`src/lib/types.ts`)
- Space interface includes `version: number`

✅ **WebSocket** (`src/lib/ws/WebSocketClient.ts`)
- `space_state` message includes `version`
- New `space_updated` message type

✅ **Store** (`src/stores/spaceStore.ts`)
- `updateSpaceVersion(spaceId, version)` action
- Updates both version and updatedAt atomically

✅ **Listener** (`src/components/space/SpaceContainer.tsx`)
- Listens to `space-version-update` custom event
- Calls store action on update
- Console.log in dev mode

✅ **UI Display** (`src/components/layout/TopToolbar.tsx`)
- Shows `v0.1.0 • s1` (app version + space version)
- Tooltip with detailed info

✅ **Space Creation** (App.tsx, SpaceCreationDialog, useAutoSave)
- All initialize with `version: 1`

### Backend (Pending)

⏳ **SQLite Schema**
- Add `version INTEGER NOT NULL DEFAULT 1` column
- Add `updated_at INTEGER NOT NULL` column

⏳ **Increment Logic**
- On any space modification: `version += 1`
- Set `updated_at = now()`

⏳ **WebSocket Broadcasting**
- Include version in `space_state` response
- Broadcast `space_updated` after modifications

⏳ **Conflict Detection**
- Check client version before accepting updates
- Return `version_conflict` on mismatch

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User modifies space (Rust backend)                          │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend:                                                     │
│ 1. Increment version in SQLite                              │
│ 2. Set updated_at = now()                                   │
│ 3. Broadcast space_updated message                          │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend WebSocket:                                         │
│ Receives: { space_updated, space_id, version, updated_at } │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ useWebSocket hook:                                          │
│ Dispatches CustomEvent("space-version-update", { ... })    │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ SpaceContainer listener:                                    │
│ Calls updateSpaceVersion(spaceId, newVersion)              │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Zustand store updates:                                      │
│ space.version = newVersion                                  │
│ space.updatedAt = Date.now()                                │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ React re-renders TopToolbar:                                │
│ Shows "v0.1.0 • s2" (version changed from 1 to 2)          │
└─────────────────────────────────────────────────────────────┘
```

## Testing Strategy

### Frontend Testing (Manual)
1. Create space → should show `s1`
2. When backend increments version → should auto-update to `s2`
3. Hover version badge → should show space version details

### Backend Testing (TBD)
1. Create space → version should be 1
2. Modify space → version should increment atomically
3. Concurrent modifications → only one should succeed

## Rollback Plan

If version increments become problematic:
1. Frontend: Remove version display, keep storage for conflict detection
2. Backend: Keep version field in DB but stop incrementing
3. Impact: Zero - feature is purely additive

## Future Enhancements

1. **Audit Log**: Store version history with timestamps
2. **Time Travel**: Revert to previous version (requires snapshots)
3. **Merge Conflicts**: Implement 3-way merge for concurrent edits
4. **Stale Warning**: Show client when local version < server version
