# 🎮 Pixi.js v8 - Documentación Ultra-Detallada

**Versión:** 2.0 Completa | **Pixi.js Version:** 8.0+ | **Enfoque:** Implementación Profesional y Troubleshooting

---

## 📋 Tabla de Contenidos

1. [Conceptos Fundamentales](#conceptos-fundamentales)
2. [Arquitectura de Pixi.js](#arquitectura-de-pixijs)
3. [Sistema de Rendering](#sistema-de-rendering)
4. [Scene Graph y Display Objects](#scene-graph-y-display-objects)
5. [Sprites y Texturas](#sprites-y-texturas)
6. [Spritesheets y Atlases](#spritesheets-y-atlases)
7. [Ticker y Game Loop](#ticker-y-game-loop)
8. [Sistema de Eventos](#sistema-de-eventos)
9. [Contenedores y Jerarquía](#contenedores-y-jerarquía)
10. [Transformaciones](#transformaciones)
11. [Rendering Avanzado](#rendering-avanzado)
12. [Performance Optimization](#performance-optimization)
13. [Accesibilidad](#accesibilidad)
14. [Integración con React](#integración-con-react)
15. [Troubleshooting y Problemas Comunes](#troubleshooting-y-problemas-comunes)
16. [Best Practices](#best-practices)
17. [Patrones de Diseño](#patrones-de-diseño)

---

## Conceptos Fundamentales

### ¿Qué es Pixi.js?

Pixi.js es un renderizador 2D ultra-rápido y flexible construido sobre WebGL/WebGPU. A diferencia de Canvas 2D nativo que es lento, Pixi.js está optimizado para:

- **Rendering ultra-rápido**: Millones de sprites en pantalla
- **Aceleración GPU**: WebGL/WebGPU para máximo rendimiento
- **Bajo overhead**: Mínimo impacto en CPU
- **Flexibilidad**: Sistema de plugins y módulos

### Conceptos Clave

| Concepto | Descripción |
|----------|-------------|
| **Renderer** | Motor que dibuja en el canvas (WebGL, WebGPU, Canvas) |
| **Stage** | Contenedor raíz del scene graph |
| **Container** | Contenedor de objetos (grupo/padre) |
| **DisplayObject** | Cualquier objeto visible (Sprite, Container, Graphics, etc) |
| **Sprite** | Imagen/textura renderizable en pantalla |
| **Texture** | Imagen cargada en memoria GPU |
| **Anchor** | Punto de referencia del objeto (0,0 = top-left, 0.5,0.5 = center) |
| **Ticker** | Sistema de timing para frames y animaciones |
| **Layer** | Grupo de objetos para organizar profundidad (z-order) |

---

## Arquitectura de Pixi.js

### Diagrama de Arquitectura

```
Application (Contenedor Principal)
    ├── Renderer (WebGL/WebGPU)
    │   └── Canvas HTML
    ├── Stage (Container Raíz)
    │   ├── Container (Capa 1)
    │   │   ├── Sprite
    │   │   ├── Sprite
    │   │   └── Container (Anidado)
    │   │       └── Sprite
    │   ├── Container (Capa 2)
    │   │   └── Graphics
    │   └── Container (Capa 3)
    │       └── AnimatedSprite
    ├── Ticker (60 FPS)
    │   ├── Callback 1 (HIGH PRIORITY)
    │   ├── Callback 2 (NORMAL)
    │   └── Callback 3 (LOW)
    └── Assets Manager
        └── Texture Cache
```

### Flujo de Rendering

```
1. Initialization
   ↓
2. Load Assets (Texturas, Spritesheets)
   ↓
3. Create Scene (Containers, Sprites)
   ↓
4. Ticker Loop (60 FPS)
   ├─ Update Game Logic (deltaTime)
   ├─ Update Animations
   ├─ Sync Camera
   ↓
5. Renderer.render(stage)
   ├─ Cull (remove off-screen)
   ├─ Batch Rendering (optimizar draw calls)
   ├─ Sort by Z-order
   ├─ Draw to WebGL
   ↓
6. Display on Canvas
   ↓
7. Next Frame (repeat from step 4)
```

---

## Sistema de Rendering

### Inicialización Básica

```typescript
import * as PIXI from 'pixi.js';

// Opción 1: Auto-detección del mejor renderer
const app = new PIXI.Application();
await app.init({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x1a1a1a,
  resizeTo: window, // Auto-resize con window
  antialias: false, // Mejor performance
  roundPixels: true, // Evita fractional pixels
});

// Opción 2: WebGL específico
const renderer = new PIXI.WebGLRenderer({
  width: 1920,
  height: 1080,
  backgroundColor: 0x000000,
});

// Opción 3: WebGPU (experimental, futuro)
const rendererWGPU = new PIXI.WebGPURenderer({
  width: 1920,
  height: 1080,
});
```

### Tipos de Renderer

#### WebGLRenderer (Recomendado)
```typescript
// Características:
// - Amplia compatibilidad (90%+ navegadores)
// - Estable y probado
// - Excelente rendimiento
// - Soporte para muchos efectos

const renderer = new PIXI.WebGLRenderer({
  width: 1920,
  height: 1080,
  backgroundColor: 0x1a1a1a,
  antialias: false, // Cuidado: más lento si true
  powerPreference: 'high-performance', // Fuerza GPU
});
```

#### WebGPURenderer (Futuro)
```typescript
// Características:
// - Rendimiento potencial superior
// - API más moderna
// - Mejor manejo de memoria
// - Aún experimental (v8)

const renderer = new PIXI.WebGPURenderer({
  width: 1920,
  height: 1080,
});
```

### Propiedades del Renderer

```typescript
const app = new PIXI.Application();
await app.init({ width: 1920, height: 1080 });

// Acceso al renderer
const renderer = app.renderer;

// Propiedades importantes
console.log(renderer.width);           // ancho en píxeles
console.log(renderer.height);          // alto en píxeles
console.log(renderer.type);            // 1 = WebGL, 2 = WebGPU
console.log(renderer.resolution);      // device pixel ratio
console.log(renderer.renderingContext); // contexto WebGL

// Métodos importantes
renderer.render(stage);                // Renderizar stage
renderer.resize(1920, 1080);          // Cambiar tamaño
renderer.generateTexture(container);  // Generar textura desde contenedor
renderer.reset();                      // Reset estado interno
renderer.clear();                      // Limpiar canvas
```

### Render Loop Manual

```typescript
// Para control manual del loop de rendering
const ticker = new PIXI.Ticker();

ticker.add((deltaTime) => {
  // Update game logic
  updateGameState(deltaTime);

  // Render scene
  app.renderer.render(app.stage);
});

ticker.start();

// Parar cuando sea necesario
ticker.stop();
```

### Opciones Avanzadas de Rendering

```typescript
const app = new PIXI.Application();
await app.init({
  width: 1920,
  height: 1080,

  // Performance
  antialias: false,              // false = mejor performance
  roundPixels: true,             // Evita subpixel rendering

  // Rendering context
  backgroundColor: 0x1a1a1a,    // Color de fondo
  backgroundAlpha: 1.0,          // Transparencia de fondo

  // GPU settings
  powerPreference: 'high-performance',

  // Canvas settings
  premultipliedAlpha: true,      // Mezcla alpha premultiplicada
  preserveDrawingBuffer: false,  // false = mejor performance

  // Resize
  resizeTo: window,              // Auto-resize con elemento
});
```

---

## Scene Graph y Display Objects

### Scene Graph (Jerarquía)

El scene graph es la estructura jerárquica de objetos renderizables:

```typescript
const app = new PIXI.Application();
await app.init({ width: 1920, height: 1080 });

// Stage es el contenedor raíz
const stage = app.stage;

// Crear jerarquía
const background = new PIXI.Sprite(bgTexture);
const playerLayer = new PIXI.Container();
const enemyLayer = new PIXI.Container();
const uiLayer = new PIXI.Container();

// Agregar a stage (orden = z-order visual)
stage.addChild(background);      // Se dibuja primero (atrás)
stage.addChild(playerLayer);     // En el medio
stage.addChild(enemyLayer);      // En el medio
stage.addChild(uiLayer);         // Se dibuja último (adelante)

// Agregar objetos a capas
const player = new PIXI.Sprite(playerTexture);
playerLayer.addChild(player);

const enemy = new PIXI.Sprite(enemyTexture);
enemyLayer.addChild(enemy);
```

### Display Objects Base

#### Sprite

```typescript
import * as PIXI from 'pixi.js';

// Crear sprite desde textura
const texture = await PIXI.Assets.load('path/to/image.png');
const sprite = new PIXI.Sprite(texture);

// Posición
sprite.x = 100;
sprite.y = 100;
sprite.position.set(100, 100);  // Equivalente

// Escala
sprite.scale.x = 2;
sprite.scale.y = 0.5;
sprite.scale.set(2, 0.5);       // Equivalente

// Rotación (en radianes)
sprite.rotation = Math.PI / 4;  // 45 grados
sprite.angle = 45;              // Equivalente (en grados)

// Anchor (punto de referencia)
sprite.anchor.set(0, 0);        // Top-left (default)
sprite.anchor.set(0.5, 0.5);    // Center

// Visibilidad
sprite.visible = true;
sprite.alpha = 0.5;             // Transparencia (0-1)

// Ancho/Alto (read-only, calculado)
console.log(sprite.width);      // Ancho en píxeles
console.log(sprite.height);     // Alto en píxeles

// Agregar a stage
app.stage.addChild(sprite);
```

#### Container

```typescript
// Contenedor para agrupar objetos
const layer = new PIXI.Container();

// Agregar objetos
layer.addChild(sprite1);
layer.addChild(sprite2);
layer.addChild(sprite3);

// Transformar todo el contenedor
layer.position.set(100, 100);
layer.scale.set(2, 2);
layer.rotation = Math.PI / 4;
layer.alpha = 0.8;

// Acceder a children
console.log(layer.children.length);  // 3
layer.children[0].alpha = 0.5;       // Modificar primer hijo

// Remover objetos
layer.removeChild(sprite1);
sprite1.destroy();

// Limpiar todo
layer.removeChildren();
layer.destroy(true); // true = destruir también children
```

#### Graphics

```typescript
// Dibujar formas vectoriales
const graphics = new PIXI.Graphics();

// Rectángulo
graphics.rect(10, 10, 100, 50);
graphics.fill({ color: 0xff0000 });

// Círculo
graphics.circle(200, 100, 50);
graphics.fill({ color: 0x00ff00 });

// Línea
graphics.moveTo(0, 0);
graphics.lineTo(200, 200);
graphics.stroke({ color: 0x0000ff, width: 2 });

// Agregar a stage
app.stage.addChild(graphics);

// Limpiar y redibujar
graphics.clear();
graphics.circle(150, 150, 75);
graphics.fill({ color: 0xffff00 });
```

#### Text

```typescript
const text = new PIXI.Text({
  text: 'Hello World',
  style: new PIXI.TextStyle({
    fontSize: 36,
    fill: 0xffffff,
    fontFamily: 'Arial',
    align: 'center',
  }),
});

text.x = 100;
text.y = 100;
app.stage.addChild(text);
```

### Propiedades Comunes de DisplayObjects

```typescript
const object = new PIXI.Sprite(texture);

// Posición y transformación
object.x = 100;
object.y = 100;
object.position.set(100, 100);
object.rotation = 0.5;          // Radianes
object.angle = 30;              // Grados (propiedad derivada)
object.scale.set(2, 2);
object.skew.set(0.5, 0);        // Sesgo en X y Y

// Visibilidad
object.visible = true;
object.alpha = 0.8;             // 0 = transparent, 1 = opaque
object.renderable = true;       // Si false, no se renderiza

// Matríz de transformación
object.transform.updateTransform();
console.log(object.worldTransform);  // Matriz global

// Propiedades en píxeles
object.width = 100;
object.height = 50;

// Anchor (punto de rotación y escala)
object.anchor.set(0.5, 0.5);    // Centro
object.anchor.set(0, 0);        // Arriba-izquierda
object.anchor.set(1, 1);        // Abajo-derecha

// Interactividad
object.eventMode = 'static';
object.on('pointerdown', () => console.log('Clicked!'));

// Z-ordering
object.zIndex = 10;
object.parent.sortChildren();   // Ordenar por zIndex

// Bounds (área que ocupa)
const bounds = object.getBounds();
console.log(bounds.x, bounds.y, bounds.width, bounds.height);

// Métodos importantes
object.destroy();               // Destruir objeto
object.toLocal(globalPos);      // Convertir coords globales a locales
object.toGlobal(localPos);      // Convertir coords locales a globales
```

---

## Sprites y Texturas

### Sistema de Texturas

```typescript
import * as PIXI from 'pixi.js';

// Opción 1: Cargar desde URL
const texture = await PIXI.Assets.load('images/sprite.png');
const sprite = new PIXI.Sprite(texture);
app.stage.addChild(sprite);

// Opción 2: Cargar múltiples
const textures = await PIXI.Assets.load([
  'images/sprite1.png',
  'images/sprite2.png',
  'images/sprite3.png',
]);

// Opción 3: Crear desde canvas
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#ff0000';
ctx.fillRect(0, 0, 256, 256);
const texture = PIXI.Texture.from(canvas);

// Opción 4: Textura en blanco
const whiteTexture = PIXI.Texture.WHITE;

// Propiedades de textura
console.log(texture.width);          // Ancho
console.log(texture.height);         // Alto
console.log(texture.valid);          // ¿Está cargada?
console.log(texture.source);         // BufferResource o ImageResource
```

### Sprite Creation y Optimización

```typescript
// Crear sprite básico
const sprite = new PIXI.Sprite(texture);

// Crear desde textura pre-cargada (más rápido)
const cachedTexture = PIXI.Assets.get('my-texture');
const sprite2 = new PIXI.Sprite(cachedTexture);

// Clone de sprite (reutilizar texture, no crear new)
const sprite3 = new PIXI.Sprite(texture);
sprite3.texture = texture;  // Reusar texture

// Pooling de sprites (best practice para muchos objetos)
class SpritePool {
  constructor(textureKey, size = 100) {
    this.available = [];
    this.textureKey = textureKey;

    // Pre-crear sprites
    for (let i = 0; i < size; i++) {
      const sprite = new PIXI.Sprite(PIXI.Assets.get(textureKey));
      sprite.visible = false;
      this.available.push(sprite);
    }
  }

  get() {
    if (this.available.length > 0) {
      return this.available.pop();
    }
    // Si se acaban, crear uno nuevo
    return new PIXI.Sprite(PIXI.Assets.get(this.textureKey));
  }

  release(sprite) {
    sprite.visible = false;
    this.available.push(sprite);
  }
}

// Uso
const particlePool = new SpritePool('particle-texture', 1000);

// Obtener del pool
const particle = particlePool.get();
particle.x = 100;
particle.y = 100;
particle.visible = true;
app.stage.addChild(particle);

// Devolver al pool
app.stage.removeChild(particle);
particlePool.release(particle);
```

### Animación de Sprites

```typescript
import gsap from 'gsap';

// Opción 1: Animación manual con Ticker
const sprite = new PIXI.Sprite(texture);
app.stage.addChild(sprite);

app.ticker.add((deltaTime) => {
  sprite.x += 2 * deltaTime;  // 2 píxeles por frame
  sprite.rotation += 0.01 * deltaTime;
});

// Opción 2: Con GSAP (más control)
gsap.to(sprite, {
  x: 500,
  y: 300,
  rotation: Math.PI * 2,
  duration: 2,
  ease: 'power2.inOut',
});

// Opción 3: AnimatedSprite (para spritesheets animados)
const animTextures = [
  PIXI.Assets.get('frame-1'),
  PIXI.Assets.get('frame-2'),
  PIXI.Assets.get('frame-3'),
];

const animSprite = new PIXI.AnimatedSprite(animTextures);
animSprite.animationSpeed = 0.1; // 10% de velocidad normal
animSprite.play();
app.stage.addChild(animSprite);
```

---

## Spritesheets y Atlases

### Cargar Spritesheets

```typescript
// Opción 1: JSON formato Pixi
const sheet = await PIXI.Assets.load('path/to/spritesheet.json');

// Opción 2: Textura packs
const textures = await PIXI.Assets.load({
  spritesheet: 'path/to/spritesheet.json'
});

// Acceder a frames
const sprite1 = new PIXI.Sprite(PIXI.Texture.from('frame-name'));
const sprite2 = new PIXI.Sprite(PIXI.Texture.from('another-frame'));
```

### Formato JSON de Spritesheet

```json
{
  "frames": {
    "tile_grass_00": {
      "frame": {
        "x": 0,
        "y": 0,
        "w": 32,
        "h": 32
      },
      "rotated": false,
      "trimmed": false,
      "spriteSourceSize": {
        "x": 0,
        "y": 0,
        "w": 32,
        "h": 32
      },
      "sourceSize": {
        "w": 32,
        "h": 32
      },
      "anchor": {
        "x": 0,
        "y": 1
      }
    },
    "tile_grass_01": { ... }
  },
  "meta": {
    "image": "spritesheet.png",
    "size": {
      "w": 1024,
      "h": 1024
    },
    "format": "RGBA8888",
    "scale": 1
  }
}
```

### Crear Spritesheet Dinámico

```typescript
class DynamicSpriteSheet {
  constructor(imageUrl, frameWidth, frameHeight) {
    this.image = new Image();
    this.image.src = imageUrl;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frames = {};
  }

  async init() {
    await new Promise(resolve => {
      this.image.onload = resolve;
    });

    // Crear canvas y extraer frames
    const canvas = document.createElement('canvas');
    canvas.width = this.frameWidth;
    canvas.height = this.frameHeight;
    const ctx = canvas.getContext('2d');

    let frameIndex = 0;
    for (let y = 0; y < this.image.height; y += this.frameHeight) {
      for (let x = 0; x < this.image.width; x += this.frameWidth) {
        ctx.clearRect(0, 0, this.frameWidth, this.frameHeight);
        ctx.drawImage(this.image, x, y, this.frameWidth, this.frameHeight,
                      0, 0, this.frameWidth, this.frameHeight);

        const texture = PIXI.Texture.from(canvas);
        this.frames[`frame_${frameIndex}`] = texture;
        frameIndex++;
      }
    }
  }

  getFrame(index) {
    return this.frames[`frame_${index}`];
  }
}
```

### Usar Spritesheet para Tiles (Patrones gather-clone)

```typescript
// Approach 1: Metadata en spritesheet JSON
const spriteData = {
  frames: {
    "ground-grass": {
      frame: { x: 0, y: 0, w: 32, h: 32 },
      anchor: { x: 0, y: 1 },  // Dynamic anchor
      colliders: [
        { x: 0, y: 0, w: 32, h: 32 }
      ]
    }
  }
};

// Approach 2: Sistema de información de tiles
class TileSystem {
  constructor(spritesheetData) {
    this.data = spritesheetData;
    this.tileInfo = new Map();
    this.parseMetadata();
  }

  parseMetadata() {
    for (const [name, frameData] of Object.entries(this.data.frames)) {
      this.tileInfo.set(name, {
        texture: PIXI.Texture.from(name),
        anchor: frameData.anchor || { x: 0, y: 0 },
        colliders: frameData.colliders || [],
        properties: frameData.properties || {}
      });
    }
  }

  getTileInfo(tileName) {
    return this.tileInfo.get(tileName);
  }

  createTileSprite(tileName) {
    const info = this.getTileInfo(tileName);
    const sprite = new PIXI.Sprite(info.texture);
    sprite.anchor.set(info.anchor.x, info.anchor.y);
    return sprite;
  }
}
```

---

## Ticker y Game Loop

### Ticker Básico

```typescript
import * as PIXI from 'pixi.js';

const app = new PIXI.Application();
await app.init({ width: 800, height: 600 });

// El app.ticker es el ticker compartido
// Ya está corriendo automáticamente

app.ticker.add((deltaTime) => {
  // Esto se ejecuta en cada frame (~60 FPS)
  // deltaTime = tiempo escalado desde último frame

  // Actualizar lógica del juego
  updateGameLogic(deltaTime);
  updateAnimation(deltaTime);
  updateCamera(deltaTime);

  // renderer.render() se llama automáticamente
});

// Detener ticker
app.ticker.stop();

// Reanudar
app.ticker.start();
```

### Control de Velocidad

```typescript
// Limitar FPS
app.ticker.maxFPS = 60;          // Máximo 60 FPS
app.ticker.minFPS = 30;          // Mínimo 30 FPS

// Velocidad del tiempo
app.ticker.speed = 1.0;          // Normal
app.ticker.speed = 0.5;          // Slow-motion
app.ticker.speed = 2.0;          // Fast-forward

// Propiedades de timing
console.log(app.ticker.FPS);     // FPS actual
console.log(app.ticker.deltaTime); // Tiempo desde último frame (escalado)
console.log(app.ticker.deltaMS);   // Milisegundos crudos
console.log(app.ticker.elapsedMS); // Tiempo total escalado
console.log(app.ticker.lastTime);  // Timestamp del último frame
```

### Prioridades en Ticker

```typescript
import { UPDATE_PRIORITY } from 'pixi.js';

const app = new PIXI.Application();
await app.init({ width: 800, height: 600 });

// Las callbacks de HIGH se ejecutan primero
app.ticker.add(() => {
  console.log('3. Se ejecuta segundo');
}, UPDATE_PRIORITY.NORMAL);

app.ticker.add(() => {
  console.log('1. Se ejecuta primero');
}, UPDATE_PRIORITY.HIGH);

app.ticker.add(() => {
  console.log('2. Se ejecuta tercero');
}, UPDATE_PRIORITY.LOW);

// Resultado:
// 1. Se ejecuta primero
// 2. Se ejecuta tercero
// 3. Se ejecuta segundo
```

### Ticker Avanzado

```typescript
// Ticker personalizado (no el compartido)
const myTicker = new PIXI.Ticker();
myTicker.maxFPS = 120;

let gameState = {
  playerX: 0,
  playerY: 0
};

// Agregar callback
myTicker.add(updateGame);

function updateGame(deltaTime) {
  gameState.playerX += 5 * deltaTime;
  gameState.playerY += 3 * deltaTime;
}

// Agregar callback una sola vez
myTicker.addOnce(() => {
  console.log('Se ejecuta una sola vez en el próximo frame');
});

// Iniciar
myTicker.start();

// Detener y limpiar
myTicker.stop();
myTicker.destroy();
```

### Patrón recomendado de Game Loop

```typescript
class GameEngine {
  constructor(app) {
    this.app = app;
    this.gameState = {
      running: true,
      paused: false,
      deltaTime: 0
    };

    // Ticker setup
    this.app.ticker.add(this.loop, this);
  }

  loop(deltaTime) {
    if (!this.gameState.running) return;
    if (this.gameState.paused) {
      deltaTime = 0; // No avanzar tiempo si está pausado
    }

    this.gameState.deltaTime = deltaTime;

    // Orden de ejecución importante
    this.handleInput();
    this.updatePhysics(deltaTime);
    this.updateAnimations(deltaTime);
    this.updateCamera(deltaTime);
    this.checkCollisions();

    // render() se llama automáticamente después del loop
  }

  handleInput() {
    // Procesar input del usuario
  }

  updatePhysics(deltaTime) {
    // Actualizar velocidades, posiciones
  }

  updateAnimations(deltaTime) {
    // Actualizar animaciones, sprites
  }

  updateCamera(deltaTime) {
    // Actualizar cámara, viewport
  }

  checkCollisions() {
    // Detectar colisiones
  }

  pause() {
    this.gameState.paused = true;
  }

  resume() {
    this.gameState.paused = false;
  }

  stop() {
    this.gameState.running = false;
    this.app.ticker.remove(this.loop, this);
  }
}
```

---

## Sistema de Eventos

### Event Handling Básico

```typescript
const sprite = new PIXI.Sprite(texture);
app.stage.addChild(sprite);

// Habilitar eventos (muy importante)
sprite.eventMode = 'static';  // 'static' para objetos que no se mueven
// O 'dynamic' si se mueven

// Click
sprite.on('pointerdown', (event) => {
  console.log('Clicked!', event.global);
});

// Hover
sprite.on('pointerover', () => {
  sprite.alpha = 0.7;
});

sprite.on('pointerout', () => {
  sprite.alpha = 1;
});

// Movimiento del ratón
sprite.on('pointermove', (event) => {
  console.log('Mouse position:', event.global.x, event.global.y);
});

// Mouse up
sprite.on('pointerup', () => {
  console.log('Released');
});

// Touch
sprite.on('touchstart', () => {
  console.log('Touched');
});
```

### Eventos del Stage

```typescript
app.stage.eventMode = 'static';

// Click en background
app.stage.on('pointerdown', (event) => {
  console.log('Stage clicked:', event.global);
});

// Raycasting - qué objeto fue clickeado
app.stage.on('pointerdown', (event) => {
  // event.target es el objeto más específico que fue clickeado
  const clickedObject = event.target;
  console.log('Clicked object:', clickedObject);
});
```

### Conversión de Coordenadas

```typescript
const sprite = new PIXI.Sprite(texture);
sprite.position.set(100, 100);
sprite.scale.set(2, 2);

sprite.on('pointerdown', (event) => {
  // event.global = coordenadas globales (en el canvas)
  const globalPos = event.global;

  // Convertir a coordenadas locales del sprite
  const localPos = sprite.toLocal(globalPos);

  console.log('Global position:', globalPos.x, globalPos.y);
  console.log('Local position:', localPos.x, localPos.y);
});
```

### Interactive Container

```typescript
// Contenedor interactivo que contiene múltiples objetos
const group = new PIXI.Container();
group.eventMode = 'static';

const sprite1 = new PIXI.Sprite(texture1);
const sprite2 = new PIXI.Sprite(texture2);

group.addChild(sprite1);
group.addChild(sprite2);

// Click en cualquier objeto del grupo
group.on('pointerdown', (event) => {
  // event.target es el objeto específico que fue clickeado
  const target = event.target;
  console.log('Clicked on:', target);
});

app.stage.addChild(group);
```

### Drag and Drop

```typescript
const sprite = new PIXI.Sprite(texture);
sprite.eventMode = 'static';
sprite.cursor = 'pointer';

let dragging = false;
let offsetX = 0;
let offsetY = 0;

sprite.on('pointerdown', (event) => {
  dragging = true;
  const pos = sprite.toLocal(event.global);
  offsetX = pos.x;
  offsetY = pos.y;
});

app.stage.on('pointermove', (event) => {
  if (!dragging) return;

  sprite.x = event.global.x - offsetX;
  sprite.y = event.global.y - offsetY;
});

app.stage.on('pointerup', () => {
  dragging = false;
});

app.stage.addChild(sprite);
```

---

## Contenedores y Jerarquía

### Estructura de Contenedores

```typescript
// Scene hierarchy
const app = new PIXI.Application();
await app.init({ width: 800, height: 600 });

// Capas por funcionalidad
const background = new PIXI.Sprite(bgTexture);
const gameLayer = new PIXI.Container();    // Juego
const uiLayer = new PIXI.Container();      // UI
const debugLayer = new PIXI.Container();   // Debug

app.stage.addChild(background);
app.stage.addChild(gameLayer);
app.stage.addChild(uiLayer);
app.stage.addChild(debugLayer);

// Dentro del game layer
const tileLayer = new PIXI.Container();
const objectLayer = new PIXI.Container();
const particleLayer = new PIXI.Container();

gameLayer.addChild(tileLayer);
gameLayer.addChild(objectLayer);
gameLayer.addChild(particleLayer);

// Llenar layers
for (let i = 0; i < tileCount; i++) {
  tileLayer.addChild(createTile(i));
}
```

### Operaciones en Contenedores

```typescript
const container = new PIXI.Container();

// Agregar
container.addChild(sprite1);
container.addChildAt(sprite2, 0);  // En posición específica

// Remover
container.removeChild(sprite1);
container.removeChildren();  // Remover todos
container.removeChildAt(0);  // Por índice

// Acceder
console.log(container.children[0]);
console.log(container.children.length);
console.log(container.getChildAt(0));
console.log(container.getChildIndex(sprite1));

// Ordenar
container.setChildIndex(sprite1, 5);  // Mover a posición 5
container.swapChildren(sprite1, sprite2);

// Sortear por propiedad
container.sortChildren();  // Ordena por zIndex

// Batch operations
const newSprites = container.children.slice();  // Copiar referencia
newSprites.forEach(sprite => {
  sprite.alpha = 0.5;
});

// Destroy
container.destroy();  // Destruir contenedor y todos sus children
container.destroy(true);  // Incluir texturas (si es necesario)
```

### Z-Ordering (Profundidad)

```typescript
// Opción 1: Orden en children (más rápido si muchos cambios)
container.removeChild(sprite);
container.addChild(sprite);  // Se agrega al final (arriba)

// Opción 2: Usar setChildIndex
container.setChildIndex(sprite, 0);  // Al principio (atrás)
container.setChildIndex(sprite, container.children.length - 1);  // Al final (adelante)

// Opción 3: Usar zIndex y sortChildren
sprite.zIndex = 10;
container.sortChildren();  // Necesario después de cambiar zIndex

// Mejor para dinámico
app.ticker.add(() => {
  // Actualizar zIndex basado en Y (isometric-like)
  gameObjects.forEach(obj => {
    obj.zIndex = obj.y;
  });
  objectLayer.sortChildren();
});
```

---

## Transformaciones

### Posición y Escala

```typescript
const sprite = new PIXI.Sprite(texture);

// Posición
sprite.x = 100;
sprite.y = 200;
sprite.position.set(100, 200);
sprite.position.copy(otherSprite.position);

// Escala
sprite.scale.x = 2;
sprite.scale.y = 0.5;
sprite.scale.set(2, 0.5);
sprite.scale.set(1.5);  // Ambos ejes

// Voltear (escala negativa)
sprite.scale.x = -1;  // Voltear horizontalmente
sprite.scale.y = -1;  // Voltear verticalmente

// Skew (sesgo)
sprite.skew.x = 0.5;
sprite.skew.y = -0.3;
```

### Rotación

```typescript
// En radianes
sprite.rotation = Math.PI / 4;  // 45 grados

// Usando angle (más intuitivo)
sprite.angle = 45;  // Grados
sprite.angle = -90;
sprite.angle = 360;  // Una vuelta completa

// Conversión
const radians = (degrees * Math.PI) / 180;
const degrees = (radians * 180) / Math.PI;
```

### Anchor (Punto de Pivote)

```typescript
// Muy importante para rotación y escala
const sprite = new PIXI.Sprite(texture);

// Top-left (default)
sprite.anchor.set(0, 0);

// Center
sprite.anchor.set(0.5, 0.5);

// Bottom-right
sprite.anchor.set(1, 1);

// Para tiles (common pattern)
sprite.anchor.set(0, 1);  // Bottom-left

// Después de cambiar anchor, la posición se ajusta
sprite.position.set(100, 100);
sprite.anchor.set(0.5, 0.5);  // Ahora está centrado en (100, 100)
```

### Pivot (Punto de Rotación Manual)

```typescript
// pivot es diferente de anchor
// pivot = punto de rotación/escala en coordenadas locales
// anchor = punto de "agarre" visual

const sprite = new PIXI.Sprite(texture);

// Sin cambiar anchor
sprite.pivot.x = 16;  // Centro horizontal (si 32x32)
sprite.pivot.y = 16;  // Centro vertical

// Ahora rotación es desde el centro
sprite.rotation = Math.PI / 4;  // Rota desde centro, no esquina
```

### Matrices de Transformación

```typescript
const sprite = new PIXI.Sprite(texture);

// Transformaciones se almacenan en matriz
sprite.position.set(100, 100);
sprite.scale.set(2, 2);
sprite.rotation = Math.PI / 4;

// Actualizar matriz (automático normalmente)
sprite.updateTransform();

// Acceder a matriz
const matrix = sprite.transform.localTransform;
console.log(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);

// Matriz global
const globalMatrix = sprite.worldTransform;

// Aplicar transformación manual
const customMatrix = new PIXI.Matrix();
customMatrix.append(new PIXI.Matrix().scale(2, 2));
customMatrix.append(new PIXI.Matrix().translate(100, 100));
sprite.transform.localTransform = customMatrix;
```

---

## Rendering Avanzado

### Masking

```typescript
// Mask: solo renderiza parte del objeto dentro de una forma

const sprite = new PIXI.Sprite(imageTexture);
sprite.position.set(100, 100);

// Mask usando Graphics
const mask = new PIXI.Graphics();
mask.circle(50, 50, 40);
mask.fill(0xff0000);

// Aplicar mask
sprite.mask = mask;

// Importante: el mask debe ser hijo del stage para funcionar
app.stage.addChild(sprite);
app.stage.addChild(mask);

// Remover mask
sprite.mask = null;

// Mask con múltiples formas
const complexMask = new PIXI.Graphics();
complexMask.rect(0, 0, 100, 100);
complexMask.fill(0xffffff);
complexMask.circle(150, 50, 40);
complexMask.fill(0x000000);  // Agujero
sprite.mask = complexMask;
```

### BlendModes

```typescript
import { BLEND_MODES } from 'pixi.js';

const sprite = new PIXI.Sprite(texture);

// Modos de blending
sprite.blendMode = BLEND_MODES.NORMAL;      // Default
sprite.blendMode = BLEND_MODES.ADD;         // Aditivo (más brillante)
sprite.blendMode = BLEND_MODES.MULTIPLY;    // Multiplicar (más oscuro)
sprite.blendMode = BLEND_MODES.SCREEN;      // Pantalla
sprite.blendMode = BLEND_MODES.OVERLAY;     // Overlay
sprite.blendMode = BLEND_MODES.DARKEN;      // Oscurecer
sprite.blendMode = BLEND_MODES.LIGHTEN;     // Aclarar

// Efectos visuales comunes
const lighting = new PIXI.Sprite(lightmapTexture);
lighting.blendMode = BLEND_MODES.MULTIPLY;  // Oscurece fondo
app.stage.addChild(lighting);

const glow = new PIXI.Sprite(glowTexture);
glow.blendMode = BLEND_MODES.ADD;           // Agrega luz
app.stage.addChild(glow);
```

### Filters

```typescript
import { BlurFilter, ColorMatrixFilter } from 'pixi.js';

const sprite = new PIXI.Sprite(texture);

// Blur
const blur = new BlurFilter();
blur.blur = 5;
sprite.filters = [blur];

// Color Matrix (ajustar colores)
const colorMatrix = new ColorMatrixFilter();
colorMatrix.brightness(1.5);  // 1.5x más brillante
colorMatrix.saturate(2);      // 2x saturación
colorMatrix.greyscale(0.5);   // 50% escala de grises
sprite.filters = [colorMatrix];

// Múltiples filtros
const blur2 = new BlurFilter();
blur2.blur = 3;
sprite.filters = [blur2, colorMatrix];

// Remover filtros
sprite.filters = null;
sprite.filters = [];
```

### Render Texture (Offscreen Rendering)

```typescript
// Renderizar a una textura en lugar del canvas

const renderTexture = new PIXI.RenderTexture(512, 512);

// Crear contenedor con objetos
const container = new PIXI.Container();
const sprite1 = new PIXI.Sprite(texture1);
const sprite2 = new PIXI.Sprite(texture2);
sprite2.position.set(100, 100);

container.addChild(sprite1);
container.addChild(sprite2);

// Renderizar contenedor a textura
app.renderer.render({
  target: renderTexture,
  container: container,
  clear: true
});

// Usar la textura renderizada
const finalSprite = new PIXI.Sprite(renderTexture);
app.stage.addChild(finalSprite);

// Reutilizar render texture
renderTexture.clear();
app.renderer.render({
  target: renderTexture,
  container: container,
  clear: true
});
```

---

## Performance Optimization

### Culling (No Renderizar Off-Screen)

```typescript
class CullingSystem {
  constructor(camera, containerSize) {
    this.camera = camera;
    this.containerSize = containerSize;
    this.margin = 100;  // Extra para seguridad
  }

  getViewportBounds() {
    const cam = this.camera;
    return {
      minX: cam.x - this.margin,
      maxX: cam.x + this.containerSize.width + this.margin,
      minY: cam.y - this.margin,
      maxY: cam.y + this.containerSize.height + this.margin
    };
  }

  isVisible(object) {
    const bounds = this.getViewportBounds();
    const objBounds = object.getBounds();

    return !(
      objBounds.right < bounds.minX ||
      objBounds.left > bounds.maxX ||
      objBounds.bottom < bounds.minY ||
      objBounds.top > bounds.maxY
    );
  }

  updateVisibility(objects) {
    objects.forEach(obj => {
      obj.visible = this.isVisible(obj);
    });
  }
}

// Uso
const culling = new CullingSystem(camera, { width: 800, height: 600 });

app.ticker.add(() => {
  culling.updateVisibility(tileSprites);
});
```

### Batching y Draw Calls

```typescript
// Pixi.js optimiza automáticamente, pero puedes ayudar:

// ✅ Bueno: Muchos sprites con misma textura (se agrupan)
const spriteGroup = new PIXI.Container();
for (let i = 0; i < 1000; i++) {
  const sprite = new PIXI.Sprite(sameTexture);
  sprite.position.set(i * 10, i * 10);
  spriteGroup.addChild(sprite);
}

// ❌ Malo: Cambiar texture continuamente (rompe batch)
sprites.forEach((sprite, i) => {
  if (i % 2 === 0) sprite.texture = texture1;
  else sprite.texture = texture2;  // Batching roto
});

// ✅ Bueno: Agrupar por textura
const group1 = new PIXI.Container();
const group2 = new PIXI.Container();

sprites.forEach((sprite, i) => {
  if (i % 2 === 0) {
    sprite.texture = texture1;
    group1.addChild(sprite);
  } else {
    sprite.texture = texture2;
    group2.addChild(sprite);
  }
});
```

### Object Pooling

```typescript
class ObjectPool {
  constructor(ObjectClass, size = 100) {
    this.ObjectClass = ObjectClass;
    this.available = [];
    this.inUse = new Set();

    // Pre-create objects
    for (let i = 0; i < size; i++) {
      this.available.push(new ObjectClass());
    }
  }

  get() {
    let obj;
    if (this.available.length > 0) {
      obj = this.available.pop();
    } else {
      obj = new this.ObjectClass();
    }
    this.inUse.add(obj);
    return obj;
  }

  release(obj) {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      obj.reset?.();  // Llamar reset si existe
      this.available.push(obj);
    }
  }

  releaseAll() {
    this.inUse.forEach(obj => this.release(obj));
  }
}

// Uso
class Particle extends PIXI.Sprite {
  reset() {
    this.alpha = 1;
    this.scale.set(1, 1);
    this.visible = false;
  }
}

const particlePool = new ObjectPool(Particle, 500);

// Obtener partícula
const particle = particlePool.get();
particle.visible = true;
particle.x = 100;
particle.y = 100;
app.stage.addChild(particle);

// Devolver al pool
app.stage.removeChild(particle);
particlePool.release(particle);
```

### Resolución y Escala

```typescript
// Importante para performance en dispositivos

const app = new PIXI.Application();
await app.init({
  width: 1920,
  height: 1080,
  resolution: window.devicePixelRatio,  // Retina-friendly

  // O renderizar a resolución menor e upscale
  // resolution: 1,
  // Luego aplicar CSS scale
});

// CSS para upscaling
// app.canvas.style.transform = 'scale(2)';
// app.canvas.style.transformOrigin = '0 0';
```

### Optimizer: Graphics Rendering

```typescript
// ❌ Malo: Redibujar graphics cada frame
const graphics = new PIXI.Graphics();

app.ticker.add(() => {
  graphics.clear();
  graphics.circle(100, 100, 50);
  graphics.fill(0xff0000);
});

// ✅ Bueno: Redibujar solo cuando cambia
const graphics = new PIXI.Graphics();
let needsRedraw = true;

function updateGraphics() {
  if (!needsRedraw) return;

  graphics.clear();
  graphics.circle(100, 100, 50);
  graphics.fill(0xff0000);

  needsRedraw = false;
}

app.ticker.add(() => {
  updateGraphics();
});

// Marcar como dirty cuando necesita actualización
function changeGraphicsColor(color) {
  needsRedraw = true;
}
```

---

## Accesibilidad

### Sistema de Accesibilidad

```typescript
const app = new PIXI.Application();
await app.init({
  width: 800,
  height: 600,
  // Accesibilidad se habilita automáticamente
});

// Configurar propiedades accesibles
const button = new PIXI.Sprite(buttonTexture);
button.eventMode = 'static';
button.accessible = true;
button.accessibleTitle = 'Play Button';
button.accessibleHint = 'Press to start the game';
button.tabIndex = 0;  // Orden de tabulación

// Contenedor accesible
const menu = new PIXI.Container();
menu.accessible = true;
menu.accessibleTitle = 'Main Menu';
menu.accessibleRole = 'menu';

// Objetos interactivos
const checkbox = new PIXI.Sprite(checkboxTexture);
checkbox.accessible = true;
checkbox.accessibleTitle = 'Enable Sound';
checkbox.accessibleRole = 'checkbox';
checkbox.accessibleChecked = true;

// Listeners para accesibilidad
checkbox.on('pointerdown', () => {
  checkbox.accessibleChecked = !checkbox.accessibleChecked;
});
```

---

## Integración con React

### Hook usePixiApp

```typescript
import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

export function usePixiApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [state, setState] = useState({
    app: null,
    stage: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    const initApp = async () => {
      try {
        const app = new PIXI.Application();
        await app.init({
          resizeTo: containerRef.current,
          backgroundColor: 0x1a1a1a,
        });

        containerRef.current.appendChild(app.canvas);
        appRef.current = app;

        setState({
          app,
          stage: app.stage,
          isLoading: false,
          error: null
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Init failed'
        }));
      }
    };

    initApp();

    return () => {
      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, []);

  return {
    containerRef,
    ...state
  };
}
```

### Component SpaceContainer

```typescript
import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { usePixiApp } from '../hooks/usePixiApp';

export function SpaceContainer() {
  const { containerRef, app, stage, isLoading } = usePixiApp();
  const tilesRef = useRef<PIXI.Sprite[]>([]);

  useEffect(() => {
    if (!app || !stage) return;

    // Crear contenedor de tiles
    const tileLayer = new PIXI.Container();
    stage.addChild(tileLayer);

    // Cargar y agregar tiles
    (async () => {
      const texture = await PIXI.Assets.load('tiles.json');

      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          const sprite = new PIXI.Sprite(texture);
          sprite.position.set(x * 32, y * 32);
          tileLayer.addChild(sprite);
          tilesRef.current.push(sprite);
        }
      }
    })();

    // Game loop
    app.ticker.add((deltaTime) => {
      // Update logic
    });

    return () => {
      stage.removeChildren();
    };
  }, [app, stage]);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen"
      style={{ position: 'relative' }}
    />
  );
}
```

---

## Troubleshooting y Problemas Comunes

### Canvas Negro (BLACK CANVAS)

**Síntomas:**
- Canvas visible pero completamente negro
- Logs muestran que los objetos están siendo creados
- stage.children.length > 0

**Causas Posibles:**

1. **Stage no visible**
```typescript
// ✅ Verificar
console.log(app.stage.visible);  // Debe ser true
console.log(app.stage.alpha);    // Debe ser >= 1

// ✅ Arreglar
app.stage.visible = true;
app.stage.alpha = 1;
```

2. **Canvas no tiene dimensiones**
```typescript
// ✅ Verificar
console.log(app.canvas.width);   // Debe ser > 0
console.log(app.canvas.height);  // Debe ser > 0

// ✅ Arreglar
app.renderer.resize(800, 600);
```

3. **Objetos fuera de pantalla**
```typescript
// ✅ Verificar
sprites.forEach(sprite => {
  console.log(sprite.x, sprite.y, sprite.visible);
});

// ✅ Posicionar correctamente
sprite.x = 100;
sprite.y = 100;
sprite.visible = true;
```

4. **Texturas no cargadas**
```typescript
// ✅ Esperar a que carguen
const texture = await PIXI.Assets.load('image.png');
const sprite = new PIXI.Sprite(texture);

// ✅ Verificar textura válida
console.log(sprite.texture.valid);
```

5. **Ticker no corriendo**
```typescript
// ✅ Verificar
console.log(app.ticker.started);  // Debe ser true

// ✅ Arreglar
app.ticker.start();
```

---

### Sprites Invisibles

**Síntomas:**
- Sprites no aparecen en pantalla
- Logs muestran que existen

**Causas:**

1. **Anchor incorrecto**
```typescript
// Problema: anchor en (0,1) pero posición esperada es arriba-izquierda
sprite.anchor.set(0, 1);
sprite.position.set(100, 100);  // Ahora está en (100, 100) ABAJO

// Solución: ajustar anchor
sprite.anchor.set(0, 0);  // Top-left
sprite.position.set(100, 100);
```

2. **Alpha = 0**
```typescript
// ✅ Verificar
console.log(sprite.alpha);  // Debe ser > 0

// ✅ Arreglar
sprite.alpha = 1;
```

3. **Fuera de viewport**
```typescript
// ✅ Verificar posición
console.log(sprite.x, sprite.y);

// ✅ Si es de un spritesheet, verificar frame correcto
const correctFrame = PIXI.Texture.from('frame-name');
sprite.texture = correctFrame;
```

---

### Performance Issues

**Síntomas:**
- FPS bajo
- Lag en interacción

**Soluciones:**

```typescript
// 1. Reducir resolución
app = new PIXI.Application();
await app.init({
  resolution: 1,  // En lugar de devicePixelRatio
  antialias: false,
  roundPixels: true
});

// 2. Activar culling
cullingSystem.updateVisibility(sprites);

// 3. Usar object pooling
const pool = new ObjectPool(Particle, 500);

// 4. Limitar FPS
app.ticker.maxFPS = 30;  // Si no necesita 60

// 5. Reducir batch breaks
// Agrupar sprites por textura

// 6. Monitorear draw calls
console.log(app.renderer.textureGC.maxUnusedTextures);
```

---

### Eventos No Funcionan

**Síntomas:**
- Click events no se activan
- Hover effects no funcionan

**Causas:**

```typescript
// ❌ Problema: eventMode no configurado
const sprite = new PIXI.Sprite(texture);
sprite.on('pointerdown', () => console.log('Click'));
// No funciona!

// ✅ Solución: configurar eventMode
const sprite = new PIXI.Sprite(texture);
sprite.eventMode = 'static';  // Muy importante
sprite.on('pointerdown', () => console.log('Click'));
// Funciona!

// Diferentes eventModes:
sprite.eventMode = 'static';   // Mejor si no se mueve
sprite.eventMode = 'dynamic';  // Si se mueve continuamente
sprite.eventMode = 'auto';     // Auto-detect
```

---

### Memory Leaks

**Síntomas:**
- Memoria aumenta constantemente
- Performance se degrada con el tiempo

**Soluciones:**

```typescript
// ✅ Siempre destruir objetos
sprite.destroy();  // Destruye el sprite
container.destroy(true);  // true = destruir children y texturas

// ✅ Remover listeners
sprite.off('pointerdown', handler);
sprite.removeAllListeners();

// ✅ Limpiar referencias
spritesArray = [];
objectsMap.clear();

// ✅ Usar object pooling en lugar de crear/destruir
const pool = new ObjectPool(Particle, 100);
const particle = pool.get();
// ... usar
pool.release(particle);

// ✅ Monitorear texturas
console.log(PIXI.Assets.cache.keys());
```

---

### Problemas de Zoom/Camera

**Síntomas:**
- Camera no sigue a player
- Zoom no funciona

**Soluciones:**

```typescript
class Camera {
  constructor(stage, viewport) {
    this.stage = stage;
    this.viewport = viewport;
    this.position = { x: 0, y: 0 };
    this.zoom = 1;
  }

  lookAt(x, y) {
    this.position.x = x - this.viewport.width / 2;
    this.position.y = y - this.viewport.height / 2;
    this.updateTransform();
  }

  zoomTo(level) {
    this.zoom = level;
    this.updateTransform();
  }

  updateTransform() {
    this.stage.position.x = -this.position.x * this.zoom;
    this.stage.position.y = -this.position.y * this.zoom;
    this.stage.scale.set(this.zoom, this.zoom);
  }
}

// Uso
const camera = new Camera(app.stage, {
  width: app.renderer.width,
  height: app.renderer.height
});

app.ticker.add(() => {
  // Follow player
  camera.lookAt(player.x, player.y);

  // Zoom con scroll
  // camera.zoomTo(zoomLevel);
});
```

---

## Best Practices

### 1. Estructura de Proyecto

```
src/
├── components/
│   └── GameContainer.tsx
├── hooks/
│   ├── usePixiApp.ts
│   └── useGameLoop.ts
├── lib/
│   ├── pixi/
│   │   ├── spritesheet.ts
│   │   ├── renderer.ts
│   │   └── camera.ts
│   └── game/
│       ├── tileMap.ts
│       ├── physics.ts
│       └── audio.ts
└── assets/
    ├── spritesheets/
    ├── images/
    └── sounds/
```

### 2. Asset Loading

```typescript
// ✅ Centralizar carga de assets
class AssetManager {
  static async init() {
    await PIXI.Assets.load([
      { alias: 'player', src: 'sprites/player.png' },
      { alias: 'tiles', src: 'sprites/tiles.json' },
      { alias: 'ui', src: 'ui/ui.json' }
    ]);
  }

  static getTexture(name) {
    return PIXI.Assets.get(name);
  }
}

// En componente
useEffect(() => {
  AssetManager.init().then(() => {
    setReady(true);
  });
}, []);
```

### 3. Error Handling

```typescript
// ✅ Manejo robusto de errores
try {
  const app = new PIXI.Application();
  await app.init({ width: 800, height: 600 });
  container.appendChild(app.canvas);
} catch (error) {
  console.error('Pixi.js init failed:', error);
  showErrorScreen('Failed to initialize game');
}

// Para assets
try {
  const texture = await PIXI.Assets.load('image.png');
} catch (error) {
  console.error('Failed to load texture:', error);
  // Usar placeholder texture
  const placeholder = PIXI.Texture.WHITE;
}
```

### 4. Cleanup

```typescript
// ✅ Limpiar recursos al desmontar
useEffect(() => {
  return () => {
    // Destruir app
    app?.destroy();

    // Limpiar listeners
    window.removeEventListener('resize', handleResize);

    // Limpiar referencias
    spritesRef.current = [];
  };
}, []);
```

### 5. Debugging

```typescript
// ✅ Debug utilities
class DebugUtils {
  static showBounds(sprite, stage) {
    const bounds = sprite.getBounds();
    const graphics = new PIXI.Graphics();
    graphics.rect(bounds.x, bounds.y, bounds.width, bounds.height);
    graphics.stroke({ color: 0xff0000, width: 2 });
    stage.addChild(graphics);
  }

  static showGrid(stage, tileSize = 32) {
    const grid = new PIXI.Graphics();
    for (let x = 0; x < 100; x += tileSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, 1000);
    }
    for (let y = 0; y < 1000; y += tileSize) {
      grid.moveTo(0, y);
      grid.lineTo(1000, y);
    }
    grid.stroke({ color: 0x444444, width: 1, alpha: 0.5 });
    stage.addChild(grid);
  }

  static logSceneGraph(stage, indent = 0) {
    const prefix = '  '.repeat(indent);
    console.log(`${prefix}${stage.constructor.name} (${stage.children.length} children)`);
    stage.children.forEach(child => {
      if (child instanceof PIXI.Container) {
        this.logSceneGraph(child, indent + 1);
      } else {
        console.log(`${prefix}  ${child.constructor.name}`);
      }
    });
  }
}

// Uso
DebugUtils.showBounds(sprite, app.stage);
DebugUtils.showGrid(app.stage);
DebugUtils.logSceneGraph(app.stage);
```

---

## Patrones de Diseño

### Patrón: Entity-Component

```typescript
class Entity {
  constructor(x, y) {
    this.position = { x, y };
    this.components = new Map();
  }

  addComponent(name, component) {
    this.components.set(name, component);
    component.entity = this;
  }

  getComponent(name) {
    return this.components.get(name);
  }

  update(deltaTime) {
    this.components.forEach(comp => {
      comp.update?.(deltaTime);
    });
  }
}

class SpriteComponent {
  constructor(texture) {
    this.sprite = new PIXI.Sprite(texture);
  }

  update() {
    this.sprite.position.set(this.entity.position.x, this.entity.position.y);
  }
}

// Uso
const player = new Entity(100, 100);
player.addComponent('sprite', new SpriteComponent(playerTexture));
player.addComponent('physics', new PhysicsComponent());
```

### Patrón: State Machine

```typescript
class StateMachine {
  constructor() {
    this.states = new Map();
    this.current = null;
  }

  addState(name, state) {
    this.states.set(name, state);
    state.stateMachine = this;
  }

  setState(name) {
    this.current?.exit?.();
    this.current = this.states.get(name);
    this.current?.enter?.();
  }

  update(deltaTime) {
    this.current?.update?.(deltaTime);
  }
}

// Uso
const states = {
  idle: {
    enter() { console.log('Idle'); },
    update() { /* ... */ },
    exit() { console.log('Exit idle'); }
  },
  running: {
    enter() { console.log('Running'); },
    update(deltaTime) { /* ... */ },
    exit() { console.log('Exit running'); }
  }
};

const stateMachine = new StateMachine();
stateMachine.addState('idle', states.idle);
stateMachine.addState('running', states.running);
stateMachine.setState('idle');
```

---

## Conclusión

Pixi.js es una librería poderosa que requiere entendimiento profundo de:

1. **Rendering**: WebGL, batching, culling
2. **Scene Graph**: Contenedores, jerarquía, z-ordering
3. **Eventos**: Interactividad, raycastin
4. **Performance**: Pooling, texturas, resolución

Con esta guía, tienes las herramientas para construir aplicaciones 2D de alto rendimiento con Pixi.js.

**Happy rendering! 🎮**
