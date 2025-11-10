/**
 * Debug Helper Script
 * Paste this in the browser console to get detailed info
 */

console.log("🔍 === SWARMVILLE DEBUG HELPER ===");
console.log("");

// 1. Check if app exists
console.log("1️⃣ PIXI App Status:");
if (window.pixiApp) {
  console.log("  ✅ Pixi App exists");
  console.log("  📊 Renderer type:", window.pixiApp.renderer.type === 1 ? "WebGL" : "WebGPU");
  console.log("  📐 Canvas size:", window.pixiApp.canvas.width, "x", window.pixiApp.canvas.height);
  console.log("  👥 Stage children:", window.pixiApp.stage.children.length);
} else {
  console.log("  ❌ Pixi App not found (window.pixiApp is undefined)");
}
console.log("");

// 2. Check canvas element
console.log("2️⃣ Canvas Element:");
const canvas = document.querySelector('canvas');
if (canvas) {
  console.log("  ✅ Canvas found in DOM");
  console.log("  📐 Size:", canvas.width, "x", canvas.height);
  console.log("  📍 Position:", canvas.style.position);
} else {
  console.log("  ❌ No canvas element found");
}
console.log("");

// 3. Check Zustand store
console.log("3️⃣ Zustand Store:");
try {
  const storeState = window.__ZUSTAND__ || {};
  console.log("  Store keys:", Object.keys(storeState));

  // Try to access space store
  if (typeof useSpaceStore !== 'undefined') {
    const state = useSpaceStore.getState();
    console.log("  📦 Spaces:", state.spaces.length);
    console.log("  👥 Agents:", state.agents.size);
    console.log("  📍 User position:", state.userPosition);
  }
} catch (e) {
  console.log("  ⚠️ Could not access store:", e.message);
}
console.log("");

// 4. Check for errors
console.log("4️⃣ Error Check:");
const errors = performance.getEntriesByType('resource').filter(r => r.name.includes('failed'));
if (errors.length > 0) {
  console.log("  ⚠️ Found", errors.length, "failed resources");
  errors.forEach(e => console.log("    -", e.name));
} else {
  console.log("  ✅ No failed resources detected");
}
console.log("");

// 5. Test - Add visible sprite
console.log("5️⃣ Visual Test:");
console.log("  🎨 Adding red test square...");
try {
  if (window.pixiApp) {
    const testGraphic = new PIXI.Graphics();
    testGraphic.rect(0, 0, 200, 200);
    testGraphic.fill(0xff0000);
    testGraphic.position.set(window.innerWidth / 2 - 100, window.innerHeight / 2 - 100);
    window.pixiApp.stage.addChild(testGraphic);
    console.log("  ✅ Test square added at center");
    console.log("  👀 You should see a RED SQUARE in the middle");
  }
} catch (e) {
  console.log("  ❌ Failed to add test graphic:", e.message);
}
console.log("");

console.log("🔍 === DEBUG COMPLETE ===");
console.log("📋 Copy this output and share it for analysis");
