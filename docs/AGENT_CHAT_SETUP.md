# Agent Chat Setup - SimpleChatService

## Sistema Actual

El sistema de chat de agentes ahora usa **SimpleChatService** - puras llamadas API, sin dependencias de CLI.

```
AgentDialog
    ↓
SimpleChatService
    ├─ Claude → Anthropic API
    ├─ Gemini → Google Gemini API
    └─ OpenAI → OpenAI API
```

## Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env` y agrega tus API keys:

```bash
# Gemini (requerido para sprites y agentes Gemini)
VITE_GEMINI_API_KEY=tu_api_key_aqui

# Claude (opcional - solo si usas agentes Claude)
VITE_ANTHROPIC_API_KEY=tu_api_key_aqui

# OpenAI (opcional - solo si usas agentes OpenAI)
VITE_OPENAI_API_KEY=tu_api_key_aqui
```

### 2. Obtener API Keys

#### Gemini API Key
1. Ve a https://makersuite.google.com/app/apikey
2. Click en "Create API Key"
3. Copia la key a `.env`

#### Claude API Key
1. Ve a https://console.anthropic.com/
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys"
4. Click "Create Key"
5. Copia la key a `.env`

#### OpenAI API Key
1. Ve a https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copia la key a `.env`

### 3. Reiniciar Dev Server

Después de agregar las keys:

```bash
# Detén el server actual (Ctrl+C)
# Reinicia
npm run dev
```

## Uso

### Crear un Agente

1. Click en el botón "+" en la UI
2. Ingresa un nombre (ej: "Helper")
3. Selecciona un tipo (coder, designer, etc.)
4. Selecciona un modelo:
   - **Gemini** - Usa VITE_GEMINI_API_KEY
   - **Claude** - Usa VITE_ANTHROPIC_API_KEY
   - **OpenAI** - Usa VITE_OPENAI_API_KEY
5. Click "Create"

### Chatear con un Agente

1. Click en el agente en la lista de la derecha
2. Se abre el diálogo de chat
3. Escribe tu mensaje
4. El agente responde usando su API configurada

## Características

### ✅ Funciona Sin CLI
- No requiere `claude`, `gemini`, o `openai` CLI instalados
- Solo necesitas las API keys en `.env`
- Más simple y confiable

### ✅ Conversación con Contexto
- Cada agente mantiene su propia historia
- El contexto se preserva entre mensajes
- Historia se puede limpiar con `chatService.clearHistory()`

### ✅ Error Handling Robusto
- Errores claros y específicos
- Mensajes de error informativos
- Validación de API keys

### ✅ Multi-Provider
- Claude (Anthropic API)
- Gemini (Google API)
- OpenAI (OpenAI API)

## Troubleshooting

### Error: "API key not configured"

**Problema**: No tienes la API key en `.env`

**Solución**:
```bash
# 1. Verifica que .env existe
ls -la .env

# 2. Verifica que la key está presente
cat .env | grep VITE_

# 3. Agrega la key faltante
echo "VITE_ANTHROPIC_API_KEY=tu_key_aqui" >> .env

# 4. Reinicia el dev server
npm run dev
```

### Error: "API error: 401 Unauthorized"

**Problema**: La API key es inválida

**Solución**:
1. Ve al dashboard del provider
2. Regenera la API key
3. Actualiza `.env` con la nueva key
4. Reinicia el dev server

### Error: "API error: 429 Too Many Requests"

**Problema**: Has excedido el rate limit

**Solución**:
1. Espera unos minutos
2. Verifica tu plan en el dashboard del provider
3. Considera actualizar tu plan si usas mucho

### Error: "No response from [Provider]"

**Problema**: El provider no devolvió respuesta válida

**Solución**:
1. Verifica tu conexión a internet
2. Verifica el status del provider:
   - Anthropic: https://status.anthropic.com/
   - Google AI: https://status.cloud.google.com/
   - OpenAI: https://status.openai.com/
3. Intenta de nuevo en unos minutos

## Comparación: CLI vs API

### Antes (CLI approach)
```
❌ Requería CLIs instalados
❌ Scripts de wrapper complejos
❌ Timeouts y errores de proceso
❌ Comando Tauri adicional
```

### Ahora (API approach)
```
✅ Solo API keys en .env
✅ Llamadas directas a API
✅ Error handling nativo de fetch
✅ Sin dependencias de sistema
```

## Código de Ejemplo

### Crear instancia de ChatService

```typescript
import { SimpleChatService } from "./lib/ai/SimpleChatService";

// Para agente Claude
const claudeChat = new SimpleChatService("claude");

// Para agente Gemini
const geminiChat = new SimpleChatService("gemini");

// Con API key custom
const customChat = new SimpleChatService("claude", "sk-ant-...");
```

### Enviar mensaje

```typescript
try {
  const response = await chatService.sendMessage("Hola!");
  console.log(response); // Respuesta del agente
} catch (error) {
  console.error("Error:", error.message);
}
```

### Obtener historia

```typescript
const history = chatService.getHistory();
console.log(history);
// [
//   { role: "user", content: "Hola!" },
//   { role: "assistant", content: "¡Hola! ¿En qué puedo ayudarte?" }
// ]
```

### Limpiar historia

```typescript
chatService.clearHistory();
console.log(chatService.getHistory()); // []
```

## Arquitectura

```typescript
// SimpleChatService.ts

class SimpleChatService {
  // Propiedades
  private provider: "claude" | "gemini" | "openai";
  private conversationHistory: ChatMessage[];
  private apiKey?: string;

  // Métodos públicos
  async sendMessage(prompt: string): Promise<string>
  getHistory(): ChatMessage[]
  clearHistory(): void
  getProvider(): string

  // Métodos privados (uno por provider)
  private async sendViaClaudeAPI(prompt: string): Promise<string>
  private async sendViaGeminiAPI(prompt: string): Promise<string>
  private async sendViaOpenAIAPI(prompt: string): Promise<string>
}
```

## Próximos Pasos (Opcional)

### Mejoras Futuras
- [ ] Streaming de respuestas (ver tokens mientras escribe)
- [ ] Persistencia en DB (guardar conversaciones)
- [ ] Retry automático con exponential backoff
- [ ] Token counting y estimación de costos
- [ ] Multi-turn context optimization
- [ ] Tool calling (web search, etc.)

### Performance
- [ ] Cache de respuestas comunes
- [ ] Lazy loading de conversaciones
- [ ] Paginación de mensajes largos

## Recursos

- [Anthropic API Docs](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)

## Estado

**✅ FULLY FUNCTIONAL**

Build:
- Frontend: ✅ 2.94s
- Backend: ✅ No changes needed

Providers:
- Claude: ✅ Anthropic API
- Gemini: ✅ Google API
- OpenAI: ✅ OpenAI API

Dependencies:
- CLI Scripts: ❌ No longer needed
- Tauri Commands: ❌ No longer needed
- API Keys: ✅ Required in .env
