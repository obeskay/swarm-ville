# PixiJS Optimizations - Ejemplo de Uso

## Integración Completa en SpaceContainer

Aquí está un ejemplo completo de cómo usar todas las optimizaciones juntas:

```typescript
import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { usePixiApp } from "../hooks/usePixiApp";
import { GridRenderer } from "../lib/pixi/GridRenderer";
import { CharacterSprite } from "../lib/pixi/CharacterSprite";
import { CullingSystem } from "../lib/pixi/CullingSystem";
import { PerformanceMonitor } from "../lib/pixi/PerformanceMonitor";

export function OptimizedSpaceContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { app, stage, setGameLoop } = usePixiApp(containerRef);
  const [fps, setFps] = useState(60);

  // Referencias para los sistemas
  const gridRendererRef = useRef<GridRenderer | null>(null);
  const cullingSystemRef = useRef<CullingSystem | null>(null);
  const perfMonitorRef = useRef<PerformanceMonitor | null>(null);
  const charactersRef = useRef<CharacterSprite[]>([]);

  useEffect(() => {
    if (!app || !stage) return;

    const initGame = async () => {
      // 1. Crear Performance Monitor
      const perfMonitor = new PerformanceMonitor(app);
      perfMonitorRef.current = perfMonitor;

      // 2. Crear GridRenderer (con pooling automático)
      const gridRenderer = new GridRenderer(50, 50);
      await gridRenderer.init();
      gridRendererRef.current = gridRenderer;

      // 3. Agregar layers al stage
      const layers = gridRenderer.getLayers();
      stage.addChild(layers.floor);
      stage.addChild(layers.above_floor);
      stage.addChild(layers.object);

      // 4. Cargar tilemap
      await gridRenderer.loadTilemap({
        "0, 0": { floor: "grassCenter" },
        "1, 0": { floor: "grassCenter" },
        // ... más tiles
      });

      // 5. Crear Culling System
      const culling = new CullingSystem(
        window.innerWidth,
        window.innerHeight,
        150 // Margin
      );
      cullingSystemRef.current = culling;

      // 6. Crear personajes
      for (let i = 0; i < 100; i++) {
        const character = new CharacterSprite(
          { x: Math.random() * 50, y: Math.random() * 50 },
          Math.floor(Math.random() * 10) + 1,
          `Agent ${i}`,
          true,
          `agent-${i}`
        );
        charactersRef.current.push(character);
        layers.object.addChild(character);
      }

      // 7. Setup Game Loop
      setGameLoop((deltaTime) => {
        // Actualizar performance monitor
        perfMonitor.update();

        // Actualizar personajes
        for (const character of charactersRef.current) {
          character.update(deltaTime);
        }

        // Aplicar culling cada 5 frames (optimización)
        if (app.ticker.lastTime % 5 === 0) {
          culling.cullContainer(layers.object);
        }

        // Actualizar FPS cada segundo
        if (Math.floor(app.ticker.lastTime) % 60 === 0) {
          setFps(Math.round(perfMonitor.getAverageFPS()));
        }

        // Auto-ajustar calidad si hay lag
        if (perfMonitor.isLagging()) {
          console.warn("Performance degraded, reducing quality");
          // Reducir efectos, aumentar margen de culling, etc.
        }
      });

      // Log performance cada 10 segundos
      setInterval(() => {
        perfMonitor.logStats();
      }, 10000);
    };

    initGame();

    // Cleanup
    return () => {
      // Destruir personajes (devuelven recursos al pool)
      for (const character of charactersRef.current) {
        character.destroy();
      }
      charactersRef.current = [];
    };
  }, [app, stage]);

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />

      {/* Performance HUD */}
      <div className="absolute top-4 right-4 bg-black/50 text-white p-4 rounded">
        <div>FPS: {fps}</div>
        <div>Sprites: {charactersRef.current.length}</div>
      </div>
    </div>
  );
}
```

## Ejemplo: Integración con Viewport (Cámara)

```typescript
import { Viewport } from "pixi-viewport";

// En tu initGame()
const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  worldWidth: 50 * 32,
  worldHeight: 50 * 32,
  events: app.renderer.events,
});

stage.addChild(viewport);

// Agregar layers al viewport en lugar del stage
viewport.addChild(layers.floor);
viewport.addChild(layers.above_floor);
viewport.addChild(layers.object);

// Configurar controles
viewport
  .drag()
  .pinch()
  .wheel()
  .decelerate();

// En el game loop, actualizar culling con la posición del viewport
setGameLoop((deltaTime) => {
  perfMonitor.update();

  // Actualizar culling basado en viewport
  culling.updateViewport(
    viewport.left,
    viewport.top,
    viewport.screenWidth,
    viewport.screenHeight
  );

  culling.cullContainer(layers.object);

  // ... resto del loop
});
```

## Ejemplo: Monitoreo Avanzado

```typescript
// Crear dashboard de performance
const setupPerformanceDashboard = (perfMonitor: PerformanceMonitor) => {
  const dashboard = document.createElement('div');
  dashboard.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    border-radius: 5px;
    z-index: 9999;
  `;

  const update = () => {
    const stats = perfMonitor.getStats();
    const avgFps = perfMonitor.getAverageFPS();
    const minFps = perfMonitor.getMinFPS();

    dashboard.innerHTML = `
      <div>FPS: ${stats.fps.toFixed(1)}</div>
      <div>AVG: ${avgFps.toFixed(1)}</div>
      <div>MIN: ${minFps.toFixed(1)}</div>
      <div>Sprites: ${stats.spriteCount}</div>
      <div>Draw Calls: ~${stats.drawCalls}</div>
      <div>Delta: ${stats.deltaTime.toFixed(2)}</div>
      <div style="color: ${avgFps < 30 ? '#ff4444' : '#44ff44'}">
        ${avgFps < 30 ? '⚠️ LAGGING' : '✅ GOOD'}
      </div>
    `;
  };

  setInterval(update, 100);
  document.body.appendChild(dashboard);
};
```

## Ejemplo: Object Pooling Manual

```typescript
import { ObjectPool } from "../lib/pixi/ObjectPool";

// Pool de efectos visuales (ejemplo: explosiones)
const explosionPool = new ObjectPool<PIXI.AnimatedSprite>(
  () => {
    const textures = [/* ... */];
    return new PIXI.AnimatedSprite(textures);
  },
  (sprite) => {
    sprite.gotoAndStop(0);
    sprite.visible = false;
    sprite.alpha = 1;
  },
  30
);

// Precalentar
explosionPool.prewarm(10);

// Crear explosión
function createExplosion(x: number, y: number) {
  const explosion = explosionPool.acquire();
  explosion.x = x;
  explosion.y = y;
  explosion.visible = true;
  explosion.play();

  // Devolver al pool cuando termine
  explosion.onComplete = () => {
    explosion.stop();
    explosionPool.release(explosion);
  };

  stage.addChild(explosion);
}
```

## Ejemplo: Culling Avanzado con Múltiples Layers

```typescript
// Setup culling para diferentes layers
const setupAdvancedCulling = () => {
  const floorCulling = new CullingSystem(width, height, 200); // Más margin para floor
  const objectCulling = new CullingSystem(width, height, 100); // Menos margin para objects
  const effectsCulling = new CullingSystem(width, height, 50); // Mínimo margin para effects

  return {
    update: (cameraX: number, cameraY: number, w: number, h: number) => {
      floorCulling.updateViewport(cameraX, cameraY, w, h);
      objectCulling.updateViewport(cameraX, cameraY, w, h);
      effectsCulling.updateViewport(cameraX, cameraY, w, h);

      floorCulling.cullContainer(layers.floor);
      objectCulling.cullContainer(layers.object);
      effectsCulling.cullContainer(effectsLayer);
    }
  };
};
```

## Checklist de Optimización

### Al iniciar el juego:
- [x] Crear PerformanceMonitor
- [x] Configurar GridRenderer (pooling automático)
- [x] Crear CullingSystem
- [x] Precalentar pools necesarios
- [x] Deshabilitar interactiveChildren en layers estáticos

### En el game loop:
- [x] Actualizar PerformanceMonitor cada frame
- [x] Actualizar culling (cada 3-5 frames para optimizar)
- [x] Verificar isLagging() periódicamente
- [x] Ajustar calidad dinámicamente según FPS

### Al destruir objetos:
- [x] Devolver Graphics al pool
- [x] Devolver Sprites al pool
- [x] Limpiar referencias
- [x] Llamar destroy() correctamente

### Debugging:
- [x] Usar perfMonitor.logStats() periódicamente
- [x] Monitorear FPS promedio y mínimo
- [x] Verificar que culling esté funcionando
- [x] Revisar pool sizes (evitar overflow)

---

**Próxima actualización:** Ejemplos de BitmapText y ParticleContainer
