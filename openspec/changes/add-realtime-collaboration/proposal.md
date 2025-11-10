# Add Realtime Collaboration System

## Why
Enable multi-device, multi-user collaboration where humans and AI agents interact in real-time within shared spaces. Currently, spaces are isolated and single-user only.

## What Changes
- WebSocket server for realtime space synchronization
- SQLite-backed state persistence for spaces and agents
- Cross-device space state sync
- Human-AI agent realtime interaction
- Optimistic UI updates with server reconciliation

## Impact
- Affected specs: space-sync (new), agent-collaboration (new)
- Affected code:
  - `src-tauri/src/websocket/` (new) - WebSocket server
  - `src-tauri/src/db/spaces.rs` (new) - Space state persistence
  - `src/stores/spaceStore.ts` - Add WebSocket integration
  - `src/lib/types.ts` - Add sync types
