@tool
extends EditorScript
## Generate Office Map Tool
##
## Creates a comprehensive office layout with zones for collaboration
## Run from Godot Editor: File → Run

func _run() -> void:
	print("\n" + "=".repeat(70))
	print("OFFICE MAP GENERATOR")
	print("=".repeat(70) + "\n")

	# Generate map data
	var map_data = OfficeMapGenerator.generate_office_map(48, 48)

	# Print zone information
	print("\n📍 Generated Zones:\n")
	for zone_data in map_data["zones"]:
		var zone = zone_data as OfficeMapGenerator.OfficeZone
		var private_marker = " 🔒" if zone.is_private else ""
		print("  • [%s] %s%s" % [zone.zone_type.to_upper(), zone.name, private_marker])
		print("      Bounds: (%d, %d) → (%d, %d)" % [
			zone.bounds.position.x,
			zone.bounds.position.y,
			zone.bounds.position.x + zone.bounds.size.x,
			zone.bounds.position.y + zone.bounds.size.y
		])
		print("      Channel: %s\n" % zone.channel_id)

	# Save to JSON
	var save_path = "res://assets/maps/office_demo_generated.json"
	OfficeMapGenerator.save_map_to_json(map_data, save_path)

	# Statistics
	var tile_count = map_data["tilemap"].size()
	var zone_count = map_data["zones"].size()
	var special_count = map_data["special_tiles"].size()

	print("\n📊 Map Statistics:")
	print("   Dimensions: %dx%d" % [map_data["dimensions"]["width"], map_data["dimensions"]["height"]])
	print("   Total Tiles: %d" % tile_count)
	print("   Zones: %d" % zone_count)
	print("   Special Tiles: %d" % special_count)
	print("   Spawn Point: (%d, %d)\n" % [map_data["spawnpoint"]["x"], map_data["spawnpoint"]["y"]])

	print("=".repeat(70))
	print("✅ OFFICE MAP GENERATED SUCCESSFULLY!")
	print("=".repeat(70) + "\n")
	print("Next steps:")
	print("1. Check %s" % save_path)
	print("2. Create TileMap scene to visualize")
	print("3. Test zone-based collaboration\n")
