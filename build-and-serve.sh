#!/bin/bash
# Complete build and serve script for SwarmVille
# Builds Godot HTML5 export and starts Tauri development server

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GODOT_PROJECT="$PROJECT_ROOT/src/godot"
BUILD_OUTPUT="$PROJECT_ROOT/godot_build"
TAURI_DIR="$PROJECT_ROOT"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        SwarmVille - Complete Build & Serve Script         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check Godot installation
echo "✓ Checking Godot installation..."
if ! command -v godot &> /dev/null; then
    echo "✗ ERROR: Godot not found in PATH"
    echo "  Install with: brew install godot (macOS)"
    exit 1
fi

GODOT_VERSION=$(godot --version)
echo "  Godot version: $GODOT_VERSION"
echo ""

# Step 2: Check Node.js (for godot-mcp)
echo "✓ Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "✗ ERROR: Node.js not found in PATH"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "  Node version: $NODE_VERSION"
echo ""

# Step 3: Build Godot HTML5 export
echo "✓ Building Godot HTML5 export..."
echo "  Project: $GODOT_PROJECT"
echo "  Output: $BUILD_OUTPUT"

# Create output directory
mkdir -p "$BUILD_OUTPUT"

# Export to HTML5
cd "$GODOT_PROJECT"
godot --headless --export-release Web "../../godot_build/index.html" 2>&1 | grep -v "^$" || true

if [ -f "$BUILD_OUTPUT/index.html" ]; then
    echo "  ✓ Export successful"
    echo "  Files:"
    ls -lh "$BUILD_OUTPUT" | grep -E '\.(html|js|wasm)$' | awk '{print "    " $9 " (" $5 ")"}'
else
    echo "  ✗ Export failed - index.html not found"
    exit 1
fi
echo ""

# Step 4: Build Rust backend
echo "✓ Building Rust backend..."
cd "$TAURI_DIR"

# Check if Cargo.toml exists
if [ ! -f "Cargo.toml" ]; then
    echo "  ! No Cargo.toml found, assuming Tauri project"
fi

# Build Tauri in dev mode
echo "  Running: npm run build"
npm run build 2>&1 | tail -20
echo ""

# Step 5: Start development server
echo "✓ Starting development server..."
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          SwarmVille Development Server Running            ║"
echo "║                                                            ║"
echo "║  Frontend: Godot 4.5 HTML5 (Port 8000)                   ║"
echo "║  Backend:  Rust/Tauri WebSocket Server (Port 8080)       ║"
echo "║  Editor:   godot-mcp available                            ║"
echo "║                                                            ║"
echo "║  Press Ctrl+C to stop                                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Start Tauri development
npm run tauri:dev
