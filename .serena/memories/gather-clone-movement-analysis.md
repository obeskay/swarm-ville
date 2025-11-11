# Gather Clone Movement System Analysis

## Key Differences Found

### 1. Movement Speed
**Gather-clone**: `movementSpeed = 3.5`
**SwarmVille**: Uses `MOVE_SPEED = 0.15` (mucho más lento)

**Fix**: Aumentar velocidad a 3.5 como gather-clone

### 2. Movement Input System
**Gather-clone**:
```typescript
private getMovementInput = () => {
    const movementInput = { x: 0, y: 0 }
    const latestKey = this.playApp.keysDown[this.playApp.keysDown.length - 1] // ✅ ÚLTIMO presionado
    if (latestKey === 'ArrowUp' || latestKey === 'w') {
        movementInput.y -= 1
    // ...
}
```
**SwarmVille**: Usa `Set<string>` que no preserva orden de presión

**Fix**: Cambiar a array para detectar última tecla presionada

### 3. Movement Mode Tracking
**Gather-clone**:
```typescript
private movementMode: 'keyboard' | 'mouse' = 'mouse'
```
Distingue entre movimiento por teclado vs mouse para diferentes comportamientos

**SwarmVille**: No tiene esta distinción

**Fix**: Agregar modo de movimiento

### 4. Smooth Movement Logic
**Gather-clone**:
```typescript
const speed = this.movementSpeed * deltaTime // Multiplica por deltaTime
const angle = Math.atan2(dy, dx)
this.parent.x += Math.cos(angle) * speed
this.parent.y += Math.sin(angle) * speed
```

**SwarmVille**: Similar pero con velocidad muy baja (0.15 vs 3.5)

### 5. Path Following
**Gather-clone**: Al llegar a waypoint, continúa automáticamente:
```typescript
if (distance < speed) {
    this.pathIndex++
    if (this.pathIndex < this.path.length) {
        this.targetPosition = ... // Siguiente waypoint
    } else {
        const movementInput = this.getMovementInput() // Continúa si hay teclas presionadas
        if (movementInput.x !== 0 || movementInput.y !== 0) {
            this.moveToTile(newTilePosition.x, newTilePosition.y)
        } else {
            this.stop()
        }
    }
}
```

**SwarmVille**: Similar pero usa umbral `WAYPOINT_REACHED_DISTANCE = 5` que puede ser muy alto

## Recommendations

1. **Velocidad**: Cambiar de 0.15 a 3.5
2. **Input tracking**: Cambiar Set a Array para último-presionado
3. **Movement mode**: Agregar distinción keyboard/mouse
4. **Throttle**: Reducir o eliminar MOVEMENT_THROTTLE_MS (gather-clone no throttlea)
5. **Waypoint distance**: Reducir umbral de llegada

## Performance Notes
- Gather-clone no usa throttling en movimiento
- Confía en deltaTime para suavidad
- Más responsivo porque detecta última tecla presionada
