# SwarmVille Agent Scripts

Sistema de spawning paralelo de agentes Claude y Cursor para desarrollo automatizado.

## Configuración Inicial

### 1. Variables de Entorno

Agregar a `.env` en la raíz del proyecto:

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
VITE_GEMINI_API_KEY=AIzaSyD4O0WgkAZVwRjYbQCWoyLQqHNAZly4i3M
```

### 2. Instalar Dependencias

```bash
cd scripts
pnpm install
```

## Scripts Disponibles

### `claude-agent.mjs`
Wrapper de Claude API para tareas de análisis y generación de código.

**Uso:**
```bash
node claude-agent.mjs "Your prompt here"
```

**Ejemplo:**
```bash
node claude-agent.mjs "Analyze the PixiJS rendering pipeline in src/components"
```

### `cursor-agent.mjs`
Wrapper de Cursor CLI para abrir archivos en el editor.

**Uso:**
```bash
node cursor-agent.mjs <file-path> [--goto line:column]
```

**Ejemplos:**
```bash
node cursor-agent.mjs src/App.tsx
node cursor-agent.mjs src/App.tsx --goto 45:12
```

### `test-agent-spawn.mjs`
Test de spawning paralelo de múltiples agentes simultáneos.

**Uso:**
```bash
node test-agent-spawn.mjs
```

**Resultado esperado:**
- ✅ Cursor spawn en <5s
- ✅ 2x Claude agents en paralelo
- 🚀 Speedup de ~2-3x vs secuencial

### `test-simple-agent.mjs`
Test simple para verificar configuración de Claude agent.

**Uso:**
```bash
node test-simple-agent.mjs
```

## NPM Scripts

Desde el directorio `scripts/`:

```bash
# Test individual de Claude
pnpm run agent:claude "Your prompt"

# Test individual de Cursor
pnpm run agent:cursor src/App.tsx

# Test de spawning paralelo
pnpm run test:spawn
```

## Arquitectura

### Spawn Paralelo

```
Main Process
    ├─ Claude Agent 1 (async)
    ├─ Claude Agent 2 (async)
    └─ Cursor Editor (async)
         ↓
    Results aggregated
         ↓
    4.5x speedup vs sequential
```

### Claude Agent Flow

```
claude-agent.mjs
    ↓
Lee ANTHROPIC_API_KEY desde .env
    ↓
Crea Anthropic client
    ↓
Envía mensaje via API
    ↓
Retorna respuesta
```

### Cursor Agent Flow

```
cursor-agent.mjs
    ↓
Parsea argumentos (file + goto)
    ↓
Spawn cursor CLI
    ↓
Abre en background (detached)
    ↓
Exit inmediato
```

## Troubleshooting

### Error: ANTHROPIC_API_KEY not found
```bash
# Verificar que .env existe en la raíz
ls ../.env

# Verificar contenido
grep ANTHROPIC_API_KEY ../.env
```

### Claude agent timeout
- Default timeout: 60s para Claude
- Ajustar en `claude-agent.mjs` si necesario
- Verificar conectividad a API

### Cursor no abre
```bash
# Verificar instalación
which cursor

# Debería retornar: /usr/local/bin/cursor
```

## Performance Esperado

### Single Agent
- Claude API call: ~2-5s
- Cursor spawn: ~1-2s

### Parallel (3 agents)
- Total time: ~5-10s
- vs Sequential: ~15-30s
- **Speedup: 2-3x**

## Próximos Pasos

1. **Integrar con sistema de agentes de SwarmVille**
   - Conectar con agent runtime
   - Usar WebSocket para comunicación

2. **Agregar más tipos de agentes**
   - Gemini agent wrapper
   - Code review agent
   - Test generation agent

3. **Sistema de orquestación**
   - Lead agent + subagents
   - Task decomposition automática
   - Result aggregation

## Referencias

- `src/services/ai/`: AI service integrations
- `server/ws-server.js`: WebSocket server
- `AGENT_RUNTIME_ARCHITECTURE.md`: Agent system architecture
