# Gather-Clone Architecture Patterns

**Document Version**: 1.0
**Date**: November 13, 2025
**Purpose**: Extracted patterns from gather-clone reference for SwarmVille implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Proximity System](#proximity-system)
3. [Room & Space Management](#room--space-management)
4. [Map & Tileset Architecture](#map--tileset-architecture)
5. [Special Tiles](#special-tiles)
6. [Message & Chat System](#message--chat-system)
7. [Multiplayer Synchronization](#multiplayer-synchronization)
8. [Implementation Recommendations for SwarmVille](#implementation-recommendations-for-swarmville)

---

## Overview

Gather-clone is a TypeScript web app built with:
- **Frontend**: Next.js + Pixi.js (rendering) + TailwindCSS
- **Backend**: Socket.io + Express + Supabase (database)
- **Video**: Agora SDK for proximity-based video chat
- **Game Logic**: Tile-based movement, room-based spaces, proximity detection

**Core Architecture Principles:**
1. **Room-based isolation**: Each "room" is a separate tilemap within a realm
2. **Proximity as first-class citizen**: ProximityId assigned automatically when players within range
3. **Sparse grid storage**: Only non-empty tiles stored in `tilemap` object
4. **Layer-based rendering**: Floor → Above Floor → Objects
5. **Socket.io for real-time**: All player actions emit socket events

---

## Proximity System

### Pattern 1: 3-Tile Range Detection

**Source**: `backend/src/session.ts` → `getProximityTiles()`

```typescript
private getProximityTiles(x: number, y: number): string[] {
    const proximityTiles: string[] = []
    const range = 3  // ← PROXIMITY RANGE: 3 tiles in all directions

    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            const tileX = x + dx
            const tileY = y + dy
            proximityTiles.push(`${tileX}, ${tileY}`)
        }
    }
    return proximityTiles
}
```

**Key Insights:**
- **Range**: 3 tiles in Manhattan distance (7x7 grid centered on player)
- **Grid-based**: Uses discrete tile positions, not pixel coordinates
- **Symmetric**: Same range in all directions (no directional bias)

**SwarmVille Implementation:**
```gdscript
# In collaboration_manager.gd
const PROXIMITY_RANGE: int = 3  # tiles

func get_proximity_tiles(center: Vector2i) -> Array[Vector2i]:
    var tiles: Array[Vector2i] = []
    for dx in range(-PROXIMITY_RANGE, PROXIMITY_RANGE + 1):
        for dy in range(-PROXIMITY_RANGE, PROXIMITY_RANGE + 1):
            tiles.append(Vector2i(center.x + dx, center.y + dy))
    return tiles
```

---

### Pattern 2: Automatic Proximity ID Assignment

**Source**: `backend/src/session.ts` → `setProximityIdsWithPlayer()`

**Algorithm:**
1. Get all tiles within proximity range of player
2. Check each tile for other players
3. If any other player found:
   - If neither player has proximityId → create new UUID
   - If one player has proximityId → assign to other
   - If both have different proximityIds → merge (use one)
4. If no other players nearby → set proximityId = null
5. Emit `proximityUpdate` event to all affected players

**Visual Example:**
```
Before:          Player A moves near Player B
┌─────┬─────┐    ┌─────┬─────┐
│ A   │     │    │  A  │  B  │
│ pid │     │    │ pid │ pid │
│ null│     │    │ abc │ abc │  ← Both now share proximityId "abc"
└─────┴─────┘    └─────┴─────┘
```

**Key Insights:**
- ProximityId is **transient** (cleared when players separate)
- **Shared identifier** enables group features (video chat, collaborative UI)
- **Efficient**: Only recalculate when player moves
- **Event-driven**: Clients notified only when proximityId changes

**SwarmVille Implementation:**
```gdscript
# Add to collaboration_manager.gd
var proximity_groups: Dictionary = {}  # proximity_id -> Array[user_ids]

func assign_proximity_group(user_id: String, position: Vector2i) -> String:
    var nearby_users = get_users_in_proximity(position)

    if nearby_users.is_empty():
        # No one nearby - remove from any group
        _remove_from_proximity_group(user_id)
        return ""

    # Check if any nearby user already in a group
    for nearby in nearby_users:
        var nearby_group = _find_user_group(nearby["id"])
        if nearby_group:
            # Join existing group
            _add_to_proximity_group(user_id, nearby_group)
            return nearby_group

    # Create new group
    var new_group_id = _generate_group_id()
    _add_to_proximity_group(user_id, new_group_id)
    for nearby in nearby_users:
        _add_to_proximity_group(nearby["id"], new_group_id)

    return new_group_id
```

---

### Pattern 3: Proximity-Based Video Chat

**Source**: `backend/src/session.ts` + `frontend/app/hooks/useVideoChat.tsx`

**Mechanism:**
1. Backend assigns ProximityId to nearby players
2. Frontend receives `proximityUpdate` event with ProximityId
3. If ProximityId != null → join Agora channel with ProximityId as channel name
4. If ProximityId == null → leave Agora channel

**Video Chat Activation Flow:**
```
Player Movement → Backend detects proximity → Assigns ProximityId
                                                      ↓
                  Frontend receives proximityUpdate event
                                                      ↓
                  useVideoChat hook: join(proximityId)
                                                      ↓
                  Agora SDK creates/joins audio/video channel
```

**SwarmVille Adaptation:**
```gdscript
# Instead of video chat, trigger:
# - CollaborationManager.collaboration_bubble_formed signal
# - Visual ring around collaborating agents
# - Auto-assign shared tasks to agents in same bubble
```

---

## Room & Space Management

### Pattern 4: Realm → Rooms → Tilemap Hierarchy

**Source**: `backend/src/session.ts` → `RealmData` interface

```typescript
export type RealmData = {
    spawnpoint: {
        roomIndex: number,
        x: number,
        y: number,
    },
    rooms: Room[],  // Array of rooms within this realm
}

export interface Room {
    name: string,
    tilemap: { /* sparse grid */ },
    channelId?: string  // For private video chat
}
```

**Key Insights:**
- **Realm** = entire space (like a Gather.town "space")
- **Room** = sub-area within realm (like floors of a building)
- **Tilemap** = sparse grid of tiles (floor, above_floor, object layers)
- **Spawnpoint** = where players first appear

**Room Transitions:**
- Players can teleport between rooms via teleporter tiles
- Each room has independent tilemap
- Chat/proximity isolated per room (no cross-room proximity)

**SwarmVille Implementation:**
```gdscript
# spaces.gd (new autoload)
class_name SpaceData

var space_id: String
var spawnpoint: Dictionary = {"room": 0, "x": 5, "y": 5}
var rooms: Array[RoomData] = []

class RoomData:
    var name: String
    var tilemap: Dictionary  # "x,y" -> tile_data
    var channel_id: String  # For collaboration zones
    var zones: Array[CollaborationZone] = []
```

---

### Pattern 5: Room-Based Player Isolation

**Source**: `backend/src/session.ts` → `playerRooms` + `changeRoom()`

**Data Structures:**
```typescript
private playerRooms: { [key: number]: Set<string> } = {}
// room_index → Set of player UIDs in that room

private playerPositions: { [key: number]: { [key: string]: Set<string> } } = {}
// room_index → position_key → Set of player UIDs at that position
```

**Room Change Flow:**
1. Remove player from old room's `playerRooms` set
2. Remove player from old room's `playerPositions` grid
3. Add player to new room's structures
4. Emit `playerLeftRoom` to old room players
5. Emit `playerJoinedRoom` to new room players
6. Recalculate proximity in new room

**SwarmVille Adaptation:**
- Use rooms as **collaboration contexts** (different projects/tasks)
- Players in different rooms can't see each other
- Each room has own CollaborationManager state

---

## Map & Tileset Architecture

### Pattern 6: 3-Layer Tile System

**Source**: Map JSON structure (inferred from Room interface)

**Tile Layers:**
```typescript
tilemap: {
    [key: `${number}, ${number}`]: {
        floor?: string,         // Layer 0: Ground tiles (grass, wood, carpet)
        above_floor?: string,   // Layer 1: Furniture (desks, chairs, decorations)
        object?: string,        // Layer 2: Obstacles (walls, doors, columns)
        impassable?: boolean,   // Collision flag
        teleporter?: {          // Special behavior
            roomIndex: number,
            x: number,
            y: number,
        }
    }
}
```

**Rendering Order:**
1. **Floor** (always walkable, decorative)
2. **Above Floor** (can be walked over, visual depth)
3. **Object** (blocks movement, physical obstacles)
4. **Player sprite** (rendered above all tiles)

**SwarmVille Implementation:**
```gdscript
# tilemap_manager.gd - multi-layer support
enum TileLayer {
    FLOOR = 0,
    ABOVE_FLOOR = 1,
    OBJECT = 2
}

func load_tilemap_layers(room_data: Dictionary) -> void:
    for coord_key in room_data["tilemap"]:
        var tile = room_data["tilemap"][coord_key]
        var pos = _parse_coord_key(coord_key)

        if tile.has("floor"):
            _set_tile(TileLayer.FLOOR, pos, tile["floor"])
        if tile.has("above_floor"):
            _set_tile(TileLayer.ABOVE_FLOOR, pos, tile["above_floor"])
        if tile.has("object"):
            _set_tile(TileLayer.OBJECT, pos, tile["object"])
```

---

### Pattern 7: Sparse Grid Storage

**Source**: All tilemap structures use `{ "x, y": data }` format

**Advantages:**
- Memory efficient (only store non-empty tiles)
- Fast lookup: `O(1)` with string key
- Easy serialization (JSON)
- No fixed grid size needed

**Disadvantages:**
- Must check `if key in tilemap` before access
- Iteration requires `Object.keys()` or `for...in`

**SwarmVille Current State:**
```gdscript
# Already implemented in tilemap_manager.gd!
var tilemap: Dictionary = {}  # "x,y" → {id, type, walkable, data}

func get_tile(grid_pos: Vector2i) -> Dictionary:
    var key = "%d,%d" % [grid_pos.x, grid_pos.y]
    return tilemap.get(key, {})
```

✅ **No changes needed** - already following this pattern

---

## Special Tiles

### Pattern 8: Teleporter Tiles

**Source**: `backend/src/session.ts` → Room tilemap teleporter field

**Behavior:**
- Tile has `teleporter` property with `{roomIndex, x, y}`
- When player steps on tile → emit `teleport` event
- Backend calls `changeRoom()` → moves player to target room + position
- All players in both rooms notified

**Visual Indicator:**
- Usually a portal, elevator, or staircase sprite
- Often placed at room edges or specific locations

**SwarmVille Implementation:**
```gdscript
# In tilemap_manager.gd
func get_tile(grid_pos: Vector2i) -> Dictionary:
    var key = "%d,%d" % [grid_pos.x, grid_pos.y]
    var tile = tilemap.get(key, {})

    if tile.has("teleporter"):
        return {
            "walkable": true,
            "special": "teleporter",
            "teleporter_data": tile["teleporter"]
        }

    return tile

# In player_controller.gd
func move_to(new_grid_pos: Vector2i) -> void:
    var tile = TileMapManager.get_tile(new_grid_pos)

    if tile.get("special") == "teleporter":
        var target = tile["teleporter_data"]
        # Trigger room change
        SpaceManager.change_room(target["roomIndex"], Vector2i(target["x"], target["y"]))
        return

    # Normal movement...
```

---

### Pattern 9: Private Area Tiles (channelId)

**Source**: `Room.channelId` field

**Behavior:**
- Room can have `channelId` → makes it a "private area"
- When players enter private room → join private video channel
- Only players in that room can see/hear each other
- Used for conference rooms, focus booths, private meetings

**Visual Indicator:**
- Yellow outline or "Private" label on map
- Lock icon when player not allowed to enter

**SwarmVille Adaptation:**
```gdscript
# Use channelId for collaboration zones
class CollaborationZone:
    var zone_id: String
    var channel_id: String  # Unique identifier for this zone
    var zone_type: String   # "meeting", "private", "focus_booth"
    var bounds: Rect2i
    var allowed_users: Array[String] = []  # Empty = public

    func is_user_allowed(user_id: String) -> bool:
        return allowed_users.is_empty() or user_id in allowed_users
```

---

## Message & Chat System

### Pattern 10: Proximity-Based Chat Broadcasting

**Source**: `backend/src/sockets/sockets.ts` → `sendMessage` handler

```typescript
on('sendMessage', NewMessage, ({ session, data }) => {
    if (data.length > 300 || data.trim() === '') return

    const message = removeExtraSpaces(data)
    const uid = socket.handshake.query.uid as string

    // Emit to all players in same room
    emit('receiveMessage', { uid, message })
})
```

**Key Insights:**
- **Room-scoped**: Messages only sent to players in same room
- **No proximity filtering on backend**: All players in room receive message
- **Frontend renders**: Client decides whether to show message based on proximity
- **300 char limit**: Prevents spam

**SwarmVille Current Implementation:**
```gdscript
# collaboration_manager.gd - already has this!
func broadcast_proximity_message(speaker_id: String, message: String) -> void:
    var speaker_pos = active_users[speaker_id]["position"]

    for user_id in active_users:
        var distance = speaker_pos.distance_to(active_users[user_id]["position"])
        if distance <= proximity_range:
            proximity_chat_received.emit(speaker_id, message, distance)
```

✅ **Already implemented correctly!**

---

## Multiplayer Synchronization

### Pattern 11: Player Movement Synchronization

**Source**: `backend/src/sockets/sockets.ts` → `movePlayer` handler

**Flow:**
1. Client emits `movePlayer` with `{x, y}`
2. Backend updates player position in session
3. Backend calculates affected proximity groups
4. Backend emits `playerMoved` to all players in room
5. Backend emits `proximityUpdate` only to affected players

**Optimization:**
- Only recalculate proximity for players whose groups changed
- Batch proximity updates (not sent on every frame)
- Clients use interpolation for smooth movement

**SwarmVille Current State:**
```gdscript
# sync_manager.gd already has batching
var batch_interval: float = 0.1  # Send updates every 100ms
```

✅ **Already optimized!**

---

### Pattern 12: Socket Event Types

**Source**: `backend/src/sockets/socket-types.ts`

**Client → Server Events:**
- `joinRealm` - Enter a space
- `movePlayer` - Update position
- `teleport` - Change room
- `changedSkin` - Update avatar
- `sendMessage` - Send chat message
- `disconnect` - Leave space

**Server → Client Events:**
- `joinedRealm` - Confirm join
- `playerJoinedRoom` - New player in room
- `playerLeftRoom` - Player exited room
- `playerMoved` - Player position updated
- `playerTeleported` - Player changed room
- `playerChangedSkin` - Avatar updated
- `receiveMessage` - Chat message
- `proximityUpdate` - Proximity group changed
- `failedToJoinRoom` - Join rejected

**SwarmVille Implementation:**
```gdscript
# websocket_client.gd - add missing events
signal proximity_group_changed(group_id: String, users: Array)
signal zone_entered(zone_id: String)
signal zone_exited(zone_id: String)
signal collaboration_request(from_user: String, task: String)
```

---

## Implementation Recommendations for SwarmVille

### Priority 1: Adopt Proximity System (HIGH)

**What to copy:**
1. ✅ 3-tile proximity range (already have)
2. ⬜ Automatic proximity group ID assignment
3. ⬜ `proximityUpdate` event to notify agents
4. ⬜ Visual collaboration rings when in group

**Implementation:**
```gdscript
# Enhance collaboration_manager.gd
var proximity_groups: Dictionary = {}  # group_id -> Array[user_ids]

func _on_user_moved(user_id: String, position: Vector2i) -> void:
    var old_group = _find_user_group(user_id)
    var new_group = assign_proximity_group(user_id, position)

    if old_group != new_group:
        if old_group:
            proximity_group_disbanded.emit(old_group, proximity_groups[old_group])
        if new_group:
            proximity_group_formed.emit(new_group, proximity_groups[new_group])
```

---

### Priority 2: Add Room/Zone System (MEDIUM)

**What to copy:**
1. ⬜ Multiple rooms within a space
2. ⬜ Room-based player isolation
3. ⬜ Teleporter tiles for room transitions
4. ⬜ Private zones with channelId

**Implementation:**
```gdscript
# Create new autoload: space_manager_enhanced.gd
class_name EnhancedSpaceManager extends Node

var current_room: int = 0
var rooms: Array[RoomData] = []

class RoomData:
    var name: String
    var tilemap: Dictionary
    var zones: Array[CollaborationZone] = []
    var users_in_room: Array[String] = []

func change_room(user_id: String, target_room: int, spawn_pos: Vector2i) -> void:
    _remove_from_room(user_id, current_room)
    _add_to_room(user_id, target_room, spawn_pos)
    room_changed.emit(user_id, target_room)
```

---

### Priority 3: Fix Tileset Architecture (HIGH)

**What to copy:**
1. ✅ Sparse grid storage (already have)
2. ⬜ 3-layer system (floor, above_floor, object)
3. ⬜ Special tile properties (teleporter, impassable)
4. ⬜ Layer-based rendering in TileMap

**Implementation:**
- Create 3 TileMap layers in Godot scenes
- Configure collision only on Object layer
- Ensure sprites render in correct Z-order

---

### Priority 4: Enhance Chat System (LOW)

**What to copy:**
1. ✅ Proximity-based broadcasting (already have)
2. ⬜ Message character limit (300)
3. ⬜ Room-scoped messages
4. ⬜ Message history persistence

**Implementation:**
```gdscript
# chat_input_panel.gd
const MAX_MESSAGE_LENGTH = 300

func _on_send_pressed() -> void:
    var text = input_field.text.strip_edges()
    if text.is_empty() or text.length() > MAX_MESSAGE_LENGTH:
        return
    message_sent.emit(text)
```

---

## Summary: Key Takeaways

| Pattern | gather-clone | SwarmVille Status | Action |
|---------|--------------|-------------------|--------|
| 3-tile proximity range | ✅ | ✅ | Keep |
| Proximity group IDs | ✅ | ⬜ | **Implement** |
| Room-based isolation | ✅ | ⬜ | **Add** |
| 3-layer tilemap | ✅ | ⬜ | **Fix** |
| Teleporter tiles | ✅ | ⬜ | **Add** |
| Private zones | ✅ | ⬜ | **Add** |
| Sparse grid storage | ✅ | ✅ | Keep |
| Movement synchronization | ✅ | ✅ | Keep |
| Proximity chat | ✅ | ✅ | Keep |
| Visual indicators | ✅ | ⬜ | **Implement** |

---

**Next Steps:**
1. ✅ Document patterns (this file)
2. ⬜ Implement proximity group IDs in `collaboration_manager.gd`
3. ⬜ Add collaboration ring visual effect
4. ⬜ Create room/zone system
5. ⬜ Fix TileMap layers
6. ⬜ Add teleporter + private tile support

---

**End of Document**
