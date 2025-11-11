# SwarmVille: Plan de Migración a Godot Engine

**Objetivo**: Mantener backend Rust + Tauri, reemplazar frontend PixiJS con Godot 4.5 exportado a HTML5

**Arquitectura Final**:
```
┌─────────────────────────────┐
│   Tauri Window (Webview)    │
│  ┌─────────────────────┐    │
│  │  Godot 4.5 HTML5    │    │
│  │  (export embebido)  │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
           ↕ WebSocket
┌─────────────────────────────┐
│   Backend Rust (actual)     │
│  - Tauri Commands           │
│  - WebSocket Server         │
│  - Database (SQLite)        │
│  - AI Engine                │
└─────────────────────────────┘
```

## Fase 1: Preparación (2-3 horas)

### 1.1 Crear estructura de directorios
```
swarm-ville/
├── src/                          # Frontend Godot (reemplaza React)
│   ├── scenes/                   # Escenas GDScript
│   │   ├── main/                 # Escena principal
│   │   ├── spaces/               # Sistema de espacios
│   │   ├── agents/               # Sistema de agentes
│   │   └── ui/                   # UI
│   ├── scripts/                  # Scripts GDScript
│   │   ├── websocket_client.gd   # Cliente WebSocket
│   │   ├── space_manager.gd      # Gestor de espacios
│   │   ├── agent_manager.gd      # Gestor de agentes
│   │   └── network/              # Networking
│   ├── assets/                   # Sprites, tilesets
│   └── project.godot             # Configuración Godot
├── src-tauri/                    # Backend (sin cambios)
│   ├── src/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/                       # Archivos estáticos
│   └── godot_export.html         # Archivo HTML con export
└── godot_build/                  # Output export Godot
```

### 1.2 Tareas específicas

- [ ] Crear carpeta `src/godot` con estructura vacía
- [ ] Instalar Godot 4.5 localmente
- [ ] Crear proyecto Godot nuevo
- [ ] Configurar export a HTML5
- [ ] Actualizar `tauri.conf.json` para servir export Godot
- [ ] Actualizar `vite.config.ts` (o descartar si no se usa)

## Fase 2: Configuración Godot (3-4 horas)

### 2.1 Setup inicial de Godot

**Crear proyecto Godot 4.5**:
```bash
# En el directorio src/godot
godot --path . --quit
```

**Configurar export HTML5**:
1. En Godot: Project → Project Settings → Export
2. Crear nueva configuración "HTML5"
3. Configurar outputs

### 2.2 Estructura de escenas base

```
Main (Node2D)
├── Camera2D
├── TileMap (espacios)
├── AgentLayer (Node2D)
│   └── Agent (CharacterBody2D) [prefab]
├── UI (CanvasLayer)
│   ├── TopToolbar (Control)
│   ├── SidePanel (Control)
│   └── DialogueBox (Control)
└── NetworkManager (Node) [autoload]
```

### 2.3 Sistema de WebSocket en GDScript

**Archivo**: `src/godot/scripts/websocket_client.gd`

```gdscript
extends Node

signal space_state_received(state)
signal space_updated(version)
signal position_update(user_id, x, y)
signal user_joined(user)
signal user_left(user_id)

var websocket: WebSocketPeer
var connected: bool = false
var server_url: String = "ws://localhost:8080"

func _ready():
    websocket = WebSocketPeer.new()
    websocket.connect_to_url(server_url)

func _process(_delta):
    websocket.poll()
    var state = websocket.get_ready_state()

    if state == WebSocketPeer.STATE_OPEN:
        if not connected:
            connected = true
            print("Connected to WebSocket")

        while websocket.get_available_packet_count():
            var packet = websocket.get_message()
            _handle_message(packet)

    elif state == WebSocketPeer.STATE_CLOSED:
        connected = false

func _handle_message(message: String):
    var json = JSON.parse_string(message)
    match json.get("type"):
        "space_state":
            space_state_received.emit(json)
        "space_updated":
            space_updated.emit(json.get("version"))
        "position_update":
            position_update.emit(json.get("user_id"), json.get("x"), json.get("y"))
        "user_joined":
            user_joined.emit(json)
        "user_left":
            user_left.emit(json.get("user_id"))

func send_message(type: String, data: Dictionary):
    var message = {"type": type}
    message.merge(data)
    websocket.send_text(JSON.stringify(message))

func join_space(space_id: String, user_id: String, name: String):
    send_message("join_space", {
        "space_id": space_id,
        "user_id": user_id,
        "name": name,
        "is_agent": false
    })

func update_position(x: float, y: float, direction: String):
    send_message("update_position", {
        "x": x,
        "y": y,
        "direction": direction
    })
```

## Fase 3: Sistema de Espacios (4-5 horas)

### 3.1 SpaceManager

**Archivo**: `src/godot/scripts/space_manager.gd`

```gdscript
extends Node

class_name SpaceManager

# Datos del espacio actual
var current_space: Dictionary = {}
var version: int = 1
var tiles: TileMap

signal space_loaded
signal space_updated

func load_space(space_data: Dictionary):
    current_space = space_data
    version = space_data.get("version", 1)

    # Crear TileMap desde tilemap_data
    var tilemap_json = JSON.parse_string(space_data.get("tilemap", "{}"))
    _build_tilemap(tilemap_json)

    space_loaded.emit()

func update_space_version(new_version: int):
    version = new_version
    space_updated.emit()

func _build_tilemap(tilemap_json: Dictionary):
    # Construir TileMap desde JSON
    # Este es el equivalente al PixiJS tilemap rendering
    pass
```

### 3.2 AgentManager

**Archivo**: `src/godot/scripts/agent_manager.gd`

```gdscript
extends Node2D

class_name AgentManager

var agents: Dictionary = {}  # user_id -> Agent node
var agent_scene: PackedScene

signal agent_joined(agent_data)
signal agent_left(user_id)
signal agent_moved(user_id, x, y)

func _ready():
    agent_scene = load("res://scenes/agent/agent.tscn")

func add_agent(agent_data: Dictionary):
    var user_id = agent_data.get("id")
    if user_id not in agents:
        var agent = agent_scene.instantiate()
        agent.setup(agent_data)
        add_child(agent)
        agents[user_id] = agent
        agent_joined.emit(agent_data)

func remove_agent(user_id: String):
    if user_id in agents:
        agents[user_id].queue_free()
        agents.erase(user_id)
        agent_left.emit(user_id)

func update_agent_position(user_id: String, x: float, y: float):
    if user_id in agents:
        agents[user_id].move_to(x, y)
        agent_moved.emit(user_id, x, y)
```

## Fase 4: Integración con Tauri (2-3 horas)

### 4.1 Actualizar tauri.conf.json

```json
{
  "build": {
    "devUrl": "http://localhost:5173",  // Cambiar a localhost:8000 para Godot
    "frontendDist": "../godot_build"    // Directorio de export Godot
  }
}
```

### 4.2 Script de build

**Crear**: `build-godot.sh`

```bash
#!/bin/bash
cd src/godot
godot --headless --export-release HTML5 ../../godot_build/index.html
```

**Actualizar package.json**:

```json
{
  "scripts": {
    "build:godot": "./build-godot.sh",
    "build": "pnpm run build:godot && pnpm run tauri:build"
  }
}
```

### 4.3 Servidor HTTP para servir Godot export

En Tauri, servir el HTML5 export en lugar de React/Vite.

## Fase 5: Testing & Deployment (2-3 horas)

### 5.1 Testing

- [ ] Verificar conexión WebSocket desde Godot al backend
- [ ] Testar join_space y recepción de state
- [ ] Testar movimiento de agentes
- [ ] Testar sincronización de espacios

### 5.2 Build & Distribution

- [ ] Build final Godot → HTML5
- [ ] Build final Tauri
- [ ] Testing en Windows/Mac/Linux

## Timeline Estimado

| Fase | Horas | Status |
|------|-------|--------|
| 1. Preparación | 2-3 | ⏳ |
| 2. Setup Godot | 3-4 | ⏳ |
| 3. Espacios + Agentes | 4-5 | ⏳ |
| 4. Integración Tauri | 2-3 | ⏳ |
| 5. Testing | 2-3 | ⏳ |
| **TOTAL** | **13-18 horas** | |

## Próximos pasos

1. ✅ Confirmar este plan
2. ⏳ Empezar Fase 1: Preparación de directorios
3. ⏳ Instalar Godot 4.5
4. ⏳ Crear proyecto Godot base
