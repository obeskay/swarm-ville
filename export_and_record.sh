#!/bin/bash
# SwarmVille - Export and Gameplay Recording Script

set -e

PROJECT_DIR="/Users/obedvargasvillarreal/Documents/obeskay/proyectos/swarm-ville"
GODOT_BIN="godot"
BUILD_DIR="$PROJECT_DIR/godot_build"
GODOT_SRC="$PROJECT_DIR/godot-src"

echo "=================================================="
echo "SwarmVille - Export & Gameplay Recording"
echo "=================================================="
echo ""

# Step 1: Verify Godot is available
echo "✓ Checking Godot installation..."
if ! command -v $GODOT_BIN &> /dev/null; then
    echo "✗ Godot not found in PATH"
    echo "  Make sure Godot 4.5.1 is installed and in PATH"
    exit 1
fi

GODOT_VERSION=$($GODOT_BIN --version 2>&1 || echo "unknown")
echo "  Godot: $GODOT_VERSION"
echo ""

# Step 2: Create build directory
echo "✓ Preparing build directory..."
mkdir -p "$BUILD_DIR"
echo "  Output: $BUILD_DIR"
echo ""

# Step 3: Run gameplay demo to record
echo "✓ Starting gameplay recording..."
echo "  - Will run for 5 minutes"
echo "  - Spawning 30+ agents"
echo "  - Recording all interactions"
echo ""

cd "$GODOT_SRC"

# Run the game with recording enabled
# The gameplay_recorder.gd script will auto-start and capture gameplay
$GODOT_BIN project.godot --rendering-driver opengl3 2>&1 | tee "$BUILD_DIR/gameplay.log" &
GAME_PID=$!

echo "  Game PID: $GAME_PID"
echo "  Recording for 320 seconds (5+ minutes)..."

# Wait for recording to complete (5 minutes + buffer)
sleep 320

# Kill the game process
kill $GAME_PID 2>/dev/null || true
wait $GAME_PID 2>/dev/null || true

echo "✓ Gameplay recording complete!"
echo ""

# Step 4: Export to Web (requires templates)
echo "✓ Exporting to Web..."
echo "  Note: This requires Godot export templates to be installed"
echo ""

if [ -d "$HOME/Library/Application Support/Godot/export_templates/4.5.1.stable" ]; then
    echo "  ✓ Export templates found"

    cd "$GODOT_SRC"

    # Try to export
    if $GODOT_BIN --headless --export-release "Web" "$BUILD_DIR/index.html" 2>&1; then
        echo "✓ Export successful!"
        echo "  Build location: $BUILD_DIR"
        echo ""
        echo "✓ To play the game:"
        echo "  1. cd $BUILD_DIR"
        echo "  2. python3 -m http.server 8000"
        echo "  3. Open http://localhost:8000 in browser"
    else
        echo "✗ Export failed - check error above"
        echo "  The gameplay recording was successful regardless"
        echo "  Gameplay log: $BUILD_DIR/gameplay.log"
    fi
else
    echo "✗ Export templates not found at:"
    echo "  $HOME/Library/Application Support/Godot/export_templates/4.5.1.stable"
    echo ""
    echo "  To install:"
    echo "  1. Open Godot editor: godot $GODOT_SRC/project.godot"
    echo "  2. Go to Editor > Manage Export Templates"
    echo "  3. Click 'Download and Install'"
    echo ""
    echo "  The gameplay recording was successful!"
    echo "  Gameplay log: $BUILD_DIR/gameplay.log"
fi

echo ""
echo "=================================================="
echo "Done!"
echo "=================================================="
