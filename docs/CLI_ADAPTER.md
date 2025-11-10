# CLI Adapter System

## Overview

This project now uses a **CLI-based adapter** for AI communication, inspired by [AionUi](https://github.com/iOfficeAI/AionUi) instead of direct API calls.

## Architecture

```
AgentDialog (UI)
    ↓
ChatService (per-agent instance)
    ↓
sendMessageToCLI (Tauri bridge)
    ↓
CLI Command (gemini-cli, claude, or openai CLI)
    ↓
AI Model
```

## Key Benefits

### ✅ No API Keys in Frontend
- Uses system-installed CLIs (gemini-cli, claude, openai)
- API keys are managed by the CLI tools
- More secure than embedding keys in the app

### ✅ Multi-Provider Support
- **Gemini**: via `gemini-cli` (Google AI CLI)
- **Claude**: via `claude` (Anthropic CLI)
- **OpenAI**: via `openai` (OpenAI CLI)

### ✅ Conversation History
- Each agent maintains its own conversation history
- Context is preserved across messages
- History can be cleared or exported

## How It Works

### 1. ChatService.ts
```typescript
// Instead of direct API calls
await fetch('https://api.gemini.com/...', { ... })

// Now uses CLI
await sendMessageToCLI('gemini', prompt)
```

### 2. Per-Agent CLI Selection
Each agent uses its configured CLI:

```typescript
const agent = {
  model: {
    provider: "gemini", // or "claude" or "openai"
    modelName: "auto",
    useUserCLI: true
  }
}

// AgentDialog creates a ChatService for that specific CLI
const chatService = new ChatService(agent.model.provider);
```

### 3. Tauri Bridge
The `sendMessageToCLI()` function uses Tauri's `invoke()` to execute CLI commands:

```rust
// Rust backend (src-tauri/src/cli/mod.rs)
#[tauri::command]
pub fn execute_cli_command(request: CLIRequest) -> Result<String, String> {
  match request.cli_type.as_str() {
    "gemini" => execute_gemini(request.prompt),
    "claude" => execute_claude(request.prompt),
    "openai" => execute_openai(request.prompt),
    _ => Err("Unknown CLI type".to_string())
  }
}
```

## Comparison with AionUi

### AionUi Pattern (complex)
- Full `@office-ai/aioncli-core` integration
- Streaming support
- Tool calling (web search, file operations, etc.)
- MCP server integration
- Extension system

### SwarmVille Adapter (simplified)
- CLI execution via Tauri
- Simple request-response (no streaming yet)
- Lightweight wrapper around system CLIs
- Focus on multi-provider support

## Usage

### Basic Agent Chat
```typescript
import { ChatService } from './lib/ai/ChatService';

// Create service for Gemini
const service = new ChatService('gemini');

// Send message
const response = await service.sendMessage('Hello!');

// Get history
const history = service.getHistory();

// Clear history
service.clearHistory();

// Switch CLI
service.setCLI('claude');
```

### In AgentDialog
```tsx
// Automatically uses agent's configured CLI
const chatService = useMemo(() => {
  return new ChatService(agent.model.provider);
}, [agent?.model.provider]);

// Send message
const response = await chatService.sendMessage(inputValue);
```

## Future Enhancements

### 🔮 Planned Features
- [ ] Streaming support (like AionUi)
- [ ] Tool calling (web search, image gen, etc.)
- [ ] Conversation persistence
- [ ] Multi-turn context optimization
- [ ] Rate limiting and retry logic
- [ ] CLI health checking

### 🎯 Inspired by AionUi
We studied AionUi's architecture and adapted these concepts:
- **CLI abstraction**: Using system CLIs instead of direct API calls
- **Per-agent configuration**: Each agent has its own CLI instance
- **Conversation management**: History tracking and context
- **Multi-provider support**: Unified interface for different CLIs

## Installation Requirements

### For Gemini Support
```bash
npm install -g @google/generative-ai-cli
gemini-cli auth login
```

### For Claude Support
```bash
# Install Claude CLI (check Anthropic's docs)
claude auth login
```

### For OpenAI Support
```bash
pip install openai
export OPENAI_API_KEY="sk-..."
```

## Troubleshooting

### "CLI not detected"
- Make sure the CLI is installed globally
- Check if it's in your PATH
- Verify authentication with `<cli> auth status`

### "Command failed"
- Check CLI logs
- Verify API quotas/rate limits
- Try running the CLI manually

## Credits

This system was inspired by:
- [AionUi](https://github.com/iOfficeAI/AionUi) - Advanced Gemini CLI integration
- [@office-ai/aioncli-core](https://www.npmjs.com/package/@office-ai/aioncli-core) - Core CLI abstraction library

## License

Same as main project license.
