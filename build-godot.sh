#!/bin/bash
set -e

echo "================================"
echo "SwarmVille - Godot Build Script"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building Godot HTML5 export...${NC}"

# Check if Godot is installed
if ! command -v godot &> /dev/null; then
    echo "❌ Godot 4.5 not found in PATH"
    echo "Please install Godot 4.5 from https://godotengine.org/download"
    exit 1
fi

echo "✅ Godot found: $(godot --version)"

# Navigate to Godot project
cd "$(dirname "$0")/src/godot" || exit 1

# Create build directory
mkdir -p ../../godot_build

# Export to HTML5
echo -e "${BLUE}Exporting to HTML5...${NC}"
godot --headless --export-release Web ../../godot_build/index.html

# Check if export was successful
if [ -f "../../godot_build/index.html" ]; then
    echo -e "${GREEN}✅ Export successful!${NC}"
    echo "Output: $(cd ../.. && pwd)/godot_build/"
    ls -lh ../../godot_build/
else
    echo "❌ Export failed"
    exit 1
fi

echo -e "${GREEN}✅ Build complete!${NC}"
