# Implementation Tasks

## 1. Type Definitions
- [x] 1.1 Add `version: number` field to Space interface in `src/lib/types.ts`
- [x] 1.2 Add `version` to WebSocket `space_state` message type
- [x] 1.3 Add `space_updated` WebSocket message type with version and timestamp

## 2. Store Updates
- [x] 2.1 Add `updateSpaceVersion()` action to spaceStore
- [x] 2.2 Update version and `updatedAt` timestamp together
- [x] 2.3 Apply changes to both `spaces` array and `selectedSpace`

## 3. WebSocket Integration
- [x] 3.1 Handle `version` field in `space_state` messages
- [x] 3.2 Dispatch `space-version-update` event when version received
- [x] 3.3 Handle `space_updated` message type
- [x] 3.4 Include spaceId, version, and updatedAt in event details

## 4. Frontend Listener
- [x] 4.1 Add version update listener in SpaceContainer
- [x] 4.2 Call `updateSpaceVersion()` when event received
- [x] 4.3 Add dev mode logging with version comparison
- [x] 4.4 Filter updates to current space only

## 5. Space Creation
- [x] 5.1 Initialize `version: 1` in App.tsx space creation
- [x] 5.2 Initialize `version: 1` in SpaceCreationDialog
- [x] 5.3 Handle version in useAutoSave space loading (fallback to 1)

## 6. Backend Integration (Future)
- [ ] 6.1 Update Rust backend to store version in SQLite
- [ ] 6.2 Increment version on space modifications
- [ ] 6.3 Send version in WebSocket messages
- [ ] 6.4 Add version conflict detection
