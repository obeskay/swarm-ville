#!/bin/bash

# SwarmVille Mobile Testing Server
# Starts HTTP server and provides local IP for mobile testing

set -e

PROJECT_DIR="/Users/obedvargasvillarreal/Documents/obeskay/proyectos/swarm-ville"
BUILD_DIR="$PROJECT_DIR/godot_build"
PORT=8000

echo "=================================================="
echo "SwarmVille Mobile Testing Server"
echo "=================================================="
echo ""

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Error: Build directory not found at $BUILD_DIR"
    echo "Please run export in Godot first."
    exit 1
fi

# Check if index.html exists
if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo "❌ Error: index.html not found"
    exit 1
fi

echo "✅ Build directory found"
echo ""

# Get local IP address
echo "Finding local IP address..."
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Error: Could not determine local IP"
    echo "Please check your network connection"
    exit 1
fi

echo "✅ Local IP: $LOCAL_IP"
echo ""

# Show testing URLs
echo "=================================================="
echo "Testing URLs"
echo "=================================================="
echo ""
echo "🌐 Local Network:"
echo "   http://$LOCAL_IP:$PORT/index.html"
echo ""
echo "📱 To access from mobile:"
echo "   1. Connect mobile device to same WiFi network"
echo "   2. Open browser and visit URL above"
echo "   3. Game should load in 8-10 seconds"
echo ""

# Optional: Try to find ngrok
if command -v ngrok &> /dev/null; then
    echo "🌐 Internet Tunnel (ngrok):"
    echo "   First, start ngrok in another terminal:"
    echo "   ngrok http $PORT"
    echo "   Then use the provided ngrok URL"
    echo ""
fi

echo "=================================================="
echo "Starting Server"
echo "=================================================="
echo ""

# Change to build directory
cd "$BUILD_DIR"

# Start server
echo "✅ Server starting on port $PORT..."
echo "📁 Serving from: $BUILD_DIR"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start HTTP server
python3 -m http.server $PORT

# Cleanup on exit
trap "echo ''; echo '❌ Server stopped'; exit 0" INT TERM

exit 0
