@tool
extends EditorScript
## Sprite Import Fix Tool - Ensure pixel-perfect rendering
##
## Configures all sprite assets for crisp, non-blurry pixel art rendering
## Run from Godot Editor: File → Run

const SPRITE_DIRECTORIES = [
	"res://assets/sprites/spritesheets/",
	"res://assets/sprites/characters/",
	"res://assets/sprites/"
]

func _run() -> void:
	print("\n" + "=".repeat(70))
	print("SPRITE IMPORT FIX TOOL - Pixel-Perfect Configuration")
	print("=".repeat(70) + "\n")

	var total_fixed = 0
	var total_found = 0

	for dir_path in SPRITE_DIRECTORIES:
		print("[Processing] %s" % dir_path)
		var result = _process_directory(dir_path)
		total_fixed += result["fixed"]
		total_found += result["found"]
		print("   → Fixed %d/%d sprites\n" % [result["fixed"], result["found"]])

	print("=".repeat(70))
	print("✅ COMPLETE: Fixed %d/%d sprite imports" % [total_fixed, total_found])
	print("=".repeat(70) + "\n")
	print("Next steps:")
	print("1. Restart Godot Editor (to reload textures)")
	print("2. Run gameplay_demo scene")
	print("3. Verify sprites are crisp and pixel-perfect\n")

func _process_directory(dir_path: String) -> Dictionary:
	var result = {"fixed": 0, "found": 0}

	var dir = DirAccess.open(dir_path)
	if not dir:
		push_warning("   Directory not found: %s" % dir_path)
		return result

	dir.list_dir_begin()
	var file_name = dir.get_next()

	while file_name != "":
		# Process PNG files only
		if file_name.ends_with(".png") and not file_name.begins_with("."):
			result["found"] += 1
			var full_path = dir_path + file_name

			if _configure_sprite_import(full_path):
				result["fixed"] += 1

		file_name = dir.get_next()

	dir.list_dir_end()
	return result

func _configure_sprite_import(sprite_path: String) -> bool:
	var import_path = sprite_path + ".import"

	# Check if import file exists
	if not FileAccess.file_exists(import_path):
		push_warning("   No .import file for: %s" % sprite_path)
		return false

	# Load existing import configuration
	var config = ConfigFile.new()
	var err = config.load(import_path)

	if err != OK:
		push_error("   Failed to load .import file: %s (Error: %d)" % [import_path, err])
		return false

	# Configure pixel-perfect settings
	# Godot 4.x import structure
	var changed = false

	# Set importer type
	if config.get_value("remap", "importer", "") != "texture":
		config.set_value("remap", "importer", "texture")
		changed = true

	# Compression settings
	var compress_mode = config.get_value("params", "compress/mode", -1)
	if compress_mode != 2:  # 2 = VRAM Compressed
		config.set_value("params", "compress/mode", 2)
		changed = true

	# Disable mipmaps (critical for pixel art)
	var mipmaps = config.get_value("params", "mipmaps/generate", true)
	if mipmaps != false:
		config.set_value("params", "mipmaps/generate", false)
		changed = true

	# Fix alpha border (prevents edge artifacts)
	var fix_alpha = config.get_value("params", "process/fix_alpha_border", false)
	if fix_alpha != true:
		config.set_value("params", "process/fix_alpha_border", true)
		changed = true

	# Force nearest-neighbor filtering
	# Note: Godot 4 changed this parameter location
	if config.has_section("params"):
		var current_filter = config.get_value("params", "texture", {}).get("filter", null)
		if current_filter != 0:
			var texture_params = config.get_value("params", "texture", {})
			if texture_params is Dictionary:
				texture_params["filter"] = 0  # Nearest
				config.set_value("params", "texture", texture_params)
				changed = true

	# Alternative filter location (Godot 4.x variations)
	var detect_3d = config.get_value("params", "detect_3d/compress_to", -1)
	if detect_3d != 0:
		config.set_value("params", "detect_3d/compress_to", 0)  # Disable 3D detection
		changed = true

	# Save configuration if changed
	if changed:
		err = config.save(import_path)
		if err != OK:
			push_error("   Failed to save .import file: %s (Error: %d)" % [import_path, err])
			return false

		print("      ✅ %s" % sprite_path.get_file())
		return true
	else:
		# Already configured correctly
		return true

## Helper: Print current import settings (for debugging)
func _debug_print_import_settings(sprite_path: String) -> void:
	var import_path = sprite_path + ".import"

	if not FileAccess.file_exists(import_path):
		return

	var config = ConfigFile.new()
	config.load(import_path)

	print("   Settings for %s:" % sprite_path.get_file())
	print("      Importer: %s" % config.get_value("remap", "importer", "NONE"))
	print("      Compress: %s" % config.get_value("params", "compress/mode", "NONE"))
	print("      Mipmaps: %s" % config.get_value("params", "mipmaps/generate", "NONE"))
	print("      Fix Alpha: %s" % config.get_value("params", "process/fix_alpha_border", "NONE"))
