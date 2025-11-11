# Add Space Versioning

## Why
Spaces currently lack version tracking, making it impossible to detect when changes occur, implement conflict resolution, or audit space modifications. Without versioning, clients cannot determine if their local state is stale.

## What Changes
- Add `version` field to Space type (integer, starts at 1)
- Increment version on every space modification
- Include version in WebSocket `space_state` messages
- Add `space_updated` WebSocket event for version notifications
- Implement version tracking in frontend store
- Add console logging for version changes (dev mode)

## Impact
- Affected specs: `space-sync`
- Affected code:
  - `src/lib/types.ts:12` - Space interface
  - `src/lib/ws/WebSocketClient.ts:8` - WebSocket message types
  - `src/hooks/useWebSocket.ts:18` - Message handlers
  - `src/stores/spaceStore.ts:8` - State management
  - `src/components/space/SpaceContainer.tsx:762` - Version listener
  - `src/App.tsx:72` - Space creation
  - `src/components/space/SpaceCreationDialog.tsx:126` - Space creation
  - `src/hooks/useAutoSave.ts:138` - Space loading
