# 🎮 Pixi.js v8 - Documentación Extendida con Context7

**Completado con:** Documentación oficial de Pixi.js v8, Context7 Knowledge Base, y Best Practices

---

## 📌 CRISIS: Canvas Negro - Troubleshooting Completo

### Síntoma Principal
Canvas completamente negro a pesar de que:
- ✅ Tiles se cargan (4590+ tiles en logs)
- ✅ Spritesheets se parsean correctamente
- ✅ GridRenderer agrega sprites al stage
- ✅ Todos los objetos tienen visible=true

### Árbol de Decisión de Diagnóstico

```
Canvas Negro?
├─ ¿Canvas en el DOM? (appendChild)
│  ├─ NO → Arreglar: container.appendChild(app.canvas)
│  └─ SÍ → Siguiente
├─ ¿Canvas tiene dimensiones? (width > 0 && height > 0)
│  ├─ NO → Arreglar: renderer.resize(800, 600)
│  └─ SÍ → Siguiente
├─ ¿Stage visible? (app.stage.visible === true)
│  ├─ NO → Arreglar: app.stage.visible = true
│  └─ SÍ → Siguiente
├─ ¿Stage alpha? (app.stage.alpha >= 0.1)
│  ├─ NO → Arreglar: app.stage.alpha = 1
│  └─ SÍ → Siguiente
├─ ¿Stage tiene children? (app.stage.children.length > 0)
│  ├─ NO → Arreglar: addChild(container) antes
│  └─ SÍ → Siguiente
├─ ¿Ticker corriendo? (app.ticker.started === true)
│  ├─ NO → Arreglar: app.ticker.start()
│  └─ SÍ → Siguiente
└─ ¿Objetos en viewport? (camera.x/y visible)
   ├─ NO → Arreglar: mover camera o sprites
   └─ SÍ → Problema profundo (ver abajo)
```

### Causa #1: Canvas No Está en el DOM

**Síntoma:** Canvas existe pero no se ve en la página

```typescript
// ❌ MALO: No agregar canvas
const app = new PIXI.Application();
await app.init({ width: 800, height: 600 });
// Olvida: document.body.appendChild(app.canvas)

// ✅ CORRECTO: Agregar al DOM
const app = new PIXI.Application();
await app.init({ width: 800, height: 600 });
document.body.appendChild(app.canvas);  // ← CRÍTICO

// ✅ O con contenedor específico
const container = document.getElementById('game-container');
container.appendChild(app.canvas);
```

**Verificación:**
```javascript
// En console del navegador
console.log('Canvas en DOM:', document.querySelector('canvas') !== null);
console.log('Canvas parent:', app.canvas.parentElement?.tagName);
console.log('Canvas visible:', window.getComputedStyle(app.canvas).display);
```

---

### Causa #2: Canvas Sin Dimensiones

**Síntoma:** Canvas presente pero con width=0 o height=0

```typescript
// ❌ MALO: No especificar tamaño
const app = new PIXI.Application();
await app.init({}); // Sin width/height

// ✅ CORRECTO: Especificar explícitamente
const app = new PIXI.Application();
await app.init({
  width: 1920,
  height: 1080,
  resizeTo: window  // Auto-resize con ventana
});

// ✅ O redimensionar después
renderer.resize(window.innerWidth, window.innerHeight);
```

**Verificación:**
```javascript
console.log('Canvas width:', app.canvas.width);
console.log('Canvas height:', app.canvas.height);
console.log('Renderer width:', app.renderer.width);
console.log('Renderer height:', app.renderer.height);
```

---

### Causa #3: Stage visible = false

**Síntoma:** Todo cargado pero no renderiza

```typescript
// ❌ PROBLEMA: Stage invisible (accidental)
app.stage.visible = false;
// Nada se renderiza

// ✅ CORRECTO: Asegurar visible = true
app.stage.visible = true;  // Default, pero asegurar explícitamente

// Verificación
console.log('Stage visible:', app.stage.visible);
if (!app.stage.visible) {
  console.error('CRITICAL: Stage is invisible!');
  app.stage.visible = true;  // Arreglar inmediatamente
}
```

---

### Causa #4: Stage alpha = 0

**Síntoma:** Canvas no negro, pero transparente/invisible

```typescript
// ❌ PROBLEMA: Stage transparente
app.stage.alpha = 0;        // Invisible
app.stage.alpha = 0.5;      // Semi-transparente

// ✅ CORRECTO: Alpha = 1
app.stage.alpha = 1;        // Completamente opaco

// Verificación
console.log('Stage alpha:', app.stage.alpha);
if (app.stage.alpha < 1) {
  console.warn('Stage is not fully opaque:', app.stage.alpha);
  app.stage.alpha = 1;
}
```

---

### Causa #5: Contenedores Invisibles

**Síntoma:** Sprites no aparecen aunque el stage exista

```typescript
// ❌ PROBLEMA: Layer invisible
const tileLayer = new PIXI.Container();
tileLayer.visible = false;  // Oops!
stage.addChild(tileLayer);
tileLayer.addChild(sprite);
// Sprite no se ve

// ✅ CORRECTO: Verificar layers
const layers = {
  floor: new PIXI.Container(),
  object: new PIXI.Container(),
  ui: new PIXI.Container()
};

// Asegurar todas visible
Object.values(layers).forEach(layer => {
  layer.visible = true;  // Explícito
  stage.addChild(layer);
});

// Verificación completa
function checkLayerVisibility(container, prefix = '') {
  console.log(`${prefix}${container.constructor.name}:`);
  console.log(`  - visible: ${container.visible}`);
  console.log(`  - alpha: ${container.alpha}`);
  console.log(`  - children: ${container.children.length}`);

  container.children.forEach((child, i) => {
    if (child instanceof PIXI.Container) {
      checkLayerVisibility(child, prefix + '  ');
    } else {
      console.log(`  - [${i}] ${child.constructor.name} visible=${child.visible}`);
    }
  });
}

checkLayerVisibility(app.stage);
```

---

### Causa #6: Ticker No Corriendo

**Síntoma:** Objetos se crean pero no se renderiza

```typescript
// ❌ PROBLEMA: Ticker detenido
app.ticker.stop();
// renderer.render() nunca se llama

// ✅ CORRECTO: Asegurar ticker
app.ticker.start();

// Verificación
console.log('Ticker started:', app.ticker.started);
console.log('Ticker FPS:', app.ticker.FPS);
console.log('Ticker listeners:', app.ticker.count);

if (!app.ticker.started) {
  console.error('CRITICAL: Ticker is not running!');
  app.ticker.start();
}
```

---

### Causa #7: Objetos Fuera de Pantalla

**Síntoma:** Canvas no negro pero sprites invisibles

```typescript
// ❌ PROBLEMA: Tiles en coords negativas, camera en (0,0)
for (let x = -7; x < 10; x++) {
  for (let y = -18; y < 10; y++) {
    const sprite = new PIXI.Sprite(texture);
    sprite.position.set(x * 32, y * 32);  // (-224, -576)
    stage.addChild(sprite);
  }
}

// Camera está en (0, 0) → ve area vacía
stage.position.set(0, 0);
// Tiles están en negativas, camera no las ve!

// ✅ CORRECTO: Ajustar posición inicial o camera
// Opción 1: Mover sprites a coords positivas
sprite.position.set(x * 32 + 500, y * 32 + 500);  // Offset positivo

// Opción 2: Posicionar camera en tiles
const userX = 100, userY = 100;  // User en coords válidas
stage.position.set(-userX * 32, -userY * 32);  // Camera ve user

// Verificación
console.log('Sprite visible in viewport?');
const bounds = sprite.getBounds();
const viewport = {
  x: -stage.position.x,
  y: -stage.position.y,
  width: app.renderer.width,
  height: app.renderer.height
};

console.log('Sprite bounds:', bounds);
console.log('Viewport:', viewport);
console.log('Visible:',
  bounds.x < viewport.x + viewport.width &&
  bounds.x + bounds.width > viewport.x &&
  bounds.y < viewport.y + viewport.height &&
  bounds.y + bounds.height > viewport.y
);
```

---

### Causa #8: Problema de Rendering Context

**Síntoma:** Canvas existe pero contexto WebGL no renderiza

```typescript
// ❌ PROBLEMA: Renderer no inicializado
const renderer = new PIXI.WebGLRenderer({ width: 800, height: 600 });
// Olvida: await renderer.init()

// ✅ CORRECTO: Inicializar
const app = new PIXI.Application();
await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x1a1a1a,
  powerPreference: 'high-performance'
});

// Verificación
console.log('Renderer type:',
  app.renderer.type === 1 ? 'WebGL' :
  app.renderer.type === 2 ? 'WebGPU' :
  'Unknown'
);
console.log('Renderer initialized:', !!app.renderer);
console.log('Canvas context:', app.renderer.renderingContext);
```

---

### Causa #9: CSS Ocultando Canvas

**Síntoma:** Canvas tiene contenido pero CSS lo oculta

```css
/* ❌ MALO: CSS oculta el canvas */
canvas {
  display: none;
  visibility: hidden;
  opacity: 0;
  width: 0;
  height: 0;
  z-index: -9999;
}

/* ✅ CORRECTO: Canvas visible y tamaño completo */
canvas {
  display: block;
  width: 100%;
  height: 100%;
  z-index: 10;  /* Arriba del UI si es necesario */
}
```

**Verificación en JavaScript:**
```javascript
const style = window.getComputedStyle(app.canvas);
console.log('Canvas CSS:');
console.log('  - display:', style.display);
console.log('  - visibility:', style.visibility);
console.log('  - opacity:', style.opacity);
console.log('  - width:', style.width);
console.log('  - height:', style.height);
console.log('  - position:', style.position);
console.log('  - z-index:', style.zIndex);
```

---

## 🔍 Script de Diagnóstico Completo

Agregar esto a tu SpaceContainer para diagnóstico rápido:

```typescript
/**
 * Diagnóstico completo del canvas negro
 */
function diagnoseBlackCanvas(app) {
  console.group('🔍 PIXI.JS BLACK CANVAS DIAGNOSIS');

  // 1. Canvas Element
  console.group('1️⃣ Canvas Element');
  console.log('Canvas exists:', !!app.canvas);
  console.log('Canvas in DOM:', !!app.canvas.parentElement);
  console.log('Canvas parent:', app.canvas.parentElement?.tagName || 'NONE');
  console.log('Canvas width:', app.canvas.width);
  console.log('Canvas height:', app.canvas.height);

  const canvasStyle = window.getComputedStyle(app.canvas);
  console.log('CSS display:', canvasStyle.display);
  console.log('CSS visibility:', canvasStyle.visibility);
  console.log('CSS opacity:', canvasStyle.opacity);
  console.log('CSS z-index:', canvasStyle.zIndex);
  console.groupEnd();

  // 2. Renderer
  console.group('2️⃣ Renderer');
  console.log('Renderer type:',
    app.renderer.type === 1 ? 'WebGL' :
    app.renderer.type === 2 ? 'WebGPU' : 'Unknown'
  );
  console.log('Renderer width:', app.renderer.width);
  console.log('Renderer height:', app.renderer.height);
  console.log('Rendering context:', !!app.renderer.renderingContext);
  console.groupEnd();

  // 3. Stage
  console.group('3️⃣ Stage');
  console.log('Stage visible:', app.stage.visible);
  console.log('Stage alpha:', app.stage.alpha);
  console.log('Stage position:', { x: app.stage.x, y: app.stage.y });
  console.log('Stage scale:', { x: app.stage.scale.x, y: app.stage.scale.y });
  console.log('Stage children:', app.stage.children.length);
  console.groupEnd();

  // 4. Layers Detail
  console.group('4️⃣ Layers Detail');
  app.stage.children.forEach((container, i) => {
    if (container instanceof PIXI.Container) {
      console.log(`Layer ${i}: ${container.constructor.name}`);
      console.log(`  - visible: ${container.visible}`);
      console.log(`  - alpha: ${container.alpha}`);
      console.log(`  - children: ${container.children.length}`);

      if (container.children.length > 0) {
        const first = container.children[0];
        console.log(`  - first child: ${first.constructor.name}`);
        console.log(`    - visible: ${first.visible}`);
        console.log(`    - alpha: ${first.alpha}`);
      }
    }
  });
  console.groupEnd();

  // 5. Ticker
  console.group('5️⃣ Ticker');
  console.log('Ticker started:', app.ticker.started);
  console.log('Ticker max FPS:', app.ticker.maxFPS);
  console.log('Ticker FPS:', app.ticker.FPS);
  console.log('Ticker listeners:', app.ticker.count);
  console.groupEnd();

  // 6. Background Color
  console.group('6️⃣ Background');
  console.log('Canvas background color:', app.renderer.view?.style.backgroundColor);
  console.log('Expected background: 0x1a1a1a (dark)');
  console.groupEnd();

  // 7. Recommendations
  console.group('7️⃣ Recommended Fixes');
  const fixes = [];

  if (!app.canvas.parentElement) {
    fixes.push('❌ Canvas not in DOM - add: container.appendChild(app.canvas)');
  }
  if (app.canvas.width === 0 || app.canvas.height === 0) {
    fixes.push('❌ Canvas has no dimensions - call: renderer.resize(width, height)');
  }
  if (!app.stage.visible) {
    fixes.push('❌ Stage not visible - set: app.stage.visible = true');
  }
  if (app.stage.alpha < 0.5) {
    fixes.push('❌ Stage alpha too low - set: app.stage.alpha = 1');
  }
  if (app.stage.children.length === 0) {
    fixes.push('❌ No layers added - add containers: stage.addChild(layer)');
  }
  if (!app.ticker.started) {
    fixes.push('❌ Ticker not running - call: app.ticker.start()');
  }

  if (fixes.length === 0) {
    fixes.push('✅ All basic checks passed! Problem might be:');
    fixes.push('  - Sprites positioned outside viewport');
    fixes.push('  - Textures not loaded or invalid');
    fixes.push('  - Camera positioning issue');
    fixes.push('  - WebGL context lost or corrupted');
  }

  fixes.forEach(fix => console.log(fix));
  console.groupEnd();

  console.groupEnd();
}

// Usar en SpaceContainer después de inicializar
if (!initialized) {
  diagnoseBlackCanvas(app);
}
```

---

## ✅ Verificación Step-by-Step en React

```typescript
useEffect(() => {
  if (!app || !stage) return;

  // Step 1: Verificar canvas en DOM
  console.log('[Step 1] Canvas verification:', {
    inDOM: !!app.canvas.parentElement,
    dimensions: { w: app.canvas.width, h: app.canvas.height }
  });

  // Step 2: Verificar stage
  console.log('[Step 2] Stage verification:', {
    visible: app.stage.visible,
    alpha: app.stage.alpha,
    children: app.stage.children.length
  });

  // Step 3: Verificar layers
  console.log('[Step 3] Layers verification:');
  stage.children.forEach((layer, i) => {
    console.log(`  Layer ${i}:`, {
      visible: layer.visible,
      alpha: layer.alpha,
      children: layer.children.length
    });
  });

  // Step 4: Verificar ticker
  console.log('[Step 4] Ticker verification:', {
    started: app.ticker.started,
    fps: app.ticker.FPS,
    listeners: app.ticker.count
  });

  // Step 5: Aplicar fixes si es necesario
  if (!app.stage.visible) {
    console.warn('Fixing: stage.visible = false');
    app.stage.visible = true;
  }

  if (app.stage.alpha < 1) {
    console.warn('Fixing: stage.alpha < 1');
    app.stage.alpha = 1;
  }

  if (!app.ticker.started) {
    console.warn('Fixing: ticker not started');
    app.ticker.start();
  }

}, [app, stage, initialized]);
```

---

## 📚 Visibility en Pixi.js - Documentación Completa

### Propiedad `visible`

Según Context7 oficial de Pixi.js:

```typescript
// visible: boolean
// The visibility of the object. If false the object will not be drawn,
// and the transform will not be updated.
// Default: true

const sprite = new PIXI.Sprite(texture);

// Get visibility
const isVisible = sprite.visible;  // true (default)

// Set visibility
sprite.visible = false;  // Hide
sprite.visible = true;   // Show

// Para containers
const container = new PIXI.Container();
container.visible = false;  // Todas sus children invisibles también
```

### Propiedad `alpha`

```typescript
// alpha: number
// Transparency value (0-1)
// 0 = fully transparent
// 1 = fully opaque

sprite.alpha = 0;      // Invisible
sprite.alpha = 0.5;    // Semi-transparent
sprite.alpha = 1;      // Fully visible

// Nota: alpha=0 vs visible=false
// - alpha=0: Aún ocupa espacio, aún se calcula bounds
// - visible=false: No ocupa espacio, transforms no se actualizan
```

### Propiedad `renderable`

```typescript
// renderable: boolean
// Whether the object should be rendered
// Advanced property, useful for optimization

sprite.renderable = false;  // Skip rendering pero mantén update
sprite.renderable = true;   // Normal

// Caso de uso: actualizar objeto sin renderizar
object.renderable = false;
updateLogic(object);  // Update sin performance hit
object.renderable = true;  // Render nuevamente
```

---

## 🎯 Resumen Rápido de Fixes

| Problema | Síntoma | Fix |
|----------|---------|-----|
| Canvas no en DOM | No se ve nada | `container.appendChild(app.canvas)` |
| Canvas sin dimensiones | Canvas 0x0 | `renderer.resize(w, h)` |
| stage.visible = false | Completamente negro | `app.stage.visible = true` |
| stage.alpha < 1 | Muy transparente | `app.stage.alpha = 1` |
| Layer invisible | Algunos sprites no aparecen | `layer.visible = true` |
| Ticker parado | Sin rendering | `app.ticker.start()` |
| Sprites fuera de vista | Canvas negro pero logs OK | Ajustar camera/position |
| CSS oculta canvas | Canvas existe pero hidden | Revisar CSS display/visibility |

---

## 🚀 Production Checklist

Antes de deploy:

```typescript
// ✅ Canvas Setup
app.canvas.parentElement !== null;
app.canvas.width > 0 && app.canvas.height > 0;

// ✅ Stage Setup
app.stage.visible === true;
app.stage.alpha >= 1;

// ✅ Layers Setup
app.stage.children.every(child => child.visible);
app.stage.children.every(child => child.alpha >= 1);

// ✅ Rendering
app.ticker.started === true;
app.renderer.renderingContext !== null;

// ✅ Assets
allSprites.every(s => s.texture.valid);
allSprites.every(s => s.visible);

// ✅ Performance
app.ticker.FPS >= 30;  // Mínimo
app.renderer.textureGC.count < 1000;  // Texturas en memoria
```
