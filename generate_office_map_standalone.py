#!/usr/bin/env python3
"""
Standalone Office Map Generator
Generates office_demo_generated.json without requiring Godot Editor
"""

import json

def generate_office_map():
    """Generate office map with 12 zones following gather-clone pattern"""

    width = 48
    height = 48

    # Create zones
    zones = [
        # Reception (bottom center)
        {
            "zone_id": "reception",
            "zone_type": "reception",
            "name": "Reception & Lobby",
            "bounds": {"x": width//2 - 6, "y": height - 8, "w": 12, "h": 6},
            "channel_id": "zone_reception",
            "is_private": False
        },
        # Meeting rooms (left side, 3 rooms)
        {
            "zone_id": "meeting_1",
            "zone_type": "meeting",
            "name": "Meeting Room 1",
            "bounds": {"x": 2, "y": 10, "w": 10, "h": 10},
            "channel_id": "zone_meeting_1",
            "is_private": False
        },
        {
            "zone_id": "meeting_2",
            "zone_type": "meeting",
            "name": "Meeting Room 2",
            "bounds": {"x": 2, "y": 22, "w": 10, "h": 10},
            "channel_id": "zone_meeting_2",
            "is_private": False
        },
        {
            "zone_id": "meeting_3",
            "zone_type": "meeting",
            "name": "Meeting Room 3",
            "bounds": {"x": 2, "y": 34, "w": 10, "h": 10},
            "channel_id": "zone_meeting_3",
            "is_private": False
        },
        # Desk areas (center, 4 clusters)
        {
            "zone_id": "desk_1",
            "zone_type": "desk",
            "name": "Desk Area 1",
            "bounds": {"x": 14, "y": 8, "w": 10, "h": 10},
            "channel_id": "zone_desk_1",
            "is_private": False
        },
        {
            "zone_id": "desk_2",
            "zone_type": "desk",
            "name": "Desk Area 2",
            "bounds": {"x": 26, "y": 8, "w": 10, "h": 10},
            "channel_id": "zone_desk_2",
            "is_private": False
        },
        {
            "zone_id": "desk_3",
            "zone_type": "desk",
            "name": "Desk Area 3",
            "bounds": {"x": 14, "y": 20, "w": 10, "h": 10},
            "channel_id": "zone_desk_3",
            "is_private": False
        },
        {
            "zone_id": "desk_4",
            "zone_type": "desk",
            "name": "Desk Area 4",
            "bounds": {"x": 26, "y": 20, "w": 10, "h": 10},
            "channel_id": "zone_desk_4",
            "is_private": False
        },
        # Lounge (right side, top)
        {
            "zone_id": "lounge",
            "zone_type": "lounge",
            "name": "Lounge Area",
            "bounds": {"x": 38, "y": 8, "w": 8, "h": 10},
            "channel_id": "zone_lounge",
            "is_private": False
        },
        # Kitchen (right side, middle)
        {
            "zone_id": "kitchen",
            "zone_type": "kitchen",
            "name": "Kitchen & Break Room",
            "bounds": {"x": 38, "y": 20, "w": 8, "h": 10},
            "channel_id": "zone_kitchen",
            "is_private": False
        },
        # Focus booths (right side, 2 small rooms)
        {
            "zone_id": "focus_1",
            "zone_type": "focus",
            "name": "Focus Booth 1",
            "bounds": {"x": 38, "y": 32, "w": 4, "h": 6},
            "channel_id": "zone_focus_1",
            "is_private": True
        },
        {
            "zone_id": "focus_2",
            "zone_type": "focus",
            "name": "Focus Booth 2",
            "bounds": {"x": 42, "y": 32, "w": 4, "h": 6},
            "channel_id": "zone_focus_2",
            "is_private": True
        }
    ]

    # Create tilemap (simple floor with walls)
    tilemap = {}

    # Fill with floor
    for x in range(width):
        for y in range(height):
            key = f"{x},{y}"
            tilemap[key] = {
                "floor": "light_wood",
                "above_floor": None,
                "object": None,
                "walkable": True,
                "special": ""
            }

    # Add spawn point
    spawn_x = width // 2
    spawn_y = height - 5
    tilemap[f"{spawn_x},{spawn_y}"]["special"] = "spawn"

    # Add walls around perimeter
    for x in range(width):
        # Top wall
        tilemap[f"{x},0"]["object"] = "wall"
        tilemap[f"{x},0"]["walkable"] = False
        # Bottom wall
        tilemap[f"{x},{height-1}"]["object"] = "wall"
        tilemap[f"{x},{height-1}"]["walkable"] = False

    for y in range(height):
        # Left wall
        tilemap[f"0,{y}"]["object"] = "wall"
        tilemap[f"0,{y}"]["walkable"] = False
        # Right wall
        tilemap[f"{width-1},{y}"]["object"] = "wall"
        tilemap[f"{width-1},{y}"]["walkable"] = False

    # Add walls around zones (meeting rooms, focus booths)
    for zone in zones:
        if zone["zone_type"] in ["meeting", "focus"]:
            bounds = zone["bounds"]
            x_start = bounds["x"]
            y_start = bounds["y"]
            x_end = x_start + bounds["w"] - 1
            y_end = y_start + bounds["h"] - 1

            # Top and bottom walls
            for x in range(x_start, x_end + 1):
                tilemap[f"{x},{y_start}"]["object"] = "wall"
                tilemap[f"{x},{y_start}"]["walkable"] = False
                tilemap[f"{x},{y_end}"]["object"] = "wall"
                tilemap[f"{x},{y_end}"]["walkable"] = False

            # Left and right walls
            for y in range(y_start, y_end + 1):
                tilemap[f"{x_start},{y}"]["object"] = "wall"
                tilemap[f"{x_start},{y}"]["walkable"] = False
                tilemap[f"{x_end},{y}"]["object"] = "wall"
                tilemap[f"{x_end},{y}"]["walkable"] = False

            # Add door (middle of bottom wall)
            door_x = x_start + bounds["w"] // 2
            tilemap[f"{door_x},{y_end}"]["object"] = None
            tilemap[f"{door_x},{y_end}"]["walkable"] = True
            tilemap[f"{door_x},{y_end}"]["special"] = "door"

    # Create final map data
    map_data = {
        "dimensions": {"width": width, "height": height},
        "spawnpoint": {"room": 0, "x": spawn_x, "y": spawn_y},
        "zones": zones,
        "tilemap": tilemap
    }

    return map_data

if __name__ == "__main__":
    print("🏢 Generating office map...")

    map_data = generate_office_map()

    # Save to JSON file
    output_path = "godot-src/office_demo_generated.json"
    with open(output_path, 'w') as f:
        json.dump(map_data, f, indent=2)

    print(f"✅ Office map generated: {output_path}")
    print(f"   Dimensions: {map_data['dimensions']['width']}x{map_data['dimensions']['height']}")
    print(f"   Zones: {len(map_data['zones'])}")
    print(f"   Tiles: {len(map_data['tilemap'])}")
    print(f"   Spawn: ({map_data['spawnpoint']['x']}, {map_data['spawnpoint']['y']})")

    # Print zone summary
    print("\n📍 Zone Summary:")
    for zone in map_data['zones']:
        print(f"   - {zone['name']:20s} [{zone['zone_type']:10s}] at ({zone['bounds']['x']},{zone['bounds']['y']})")
