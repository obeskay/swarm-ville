# CLI Integration Guide for SwarmVille

Based on AionUi's implementation (https://github.com/iOfficeAI/AionUi)

## Overview

SwarmVille integrates with multiple AI CLIs:
- **Claude Code CLI** (`claude`)
- **Gemini CLI** (`gemini`)
- **OpenAI CLI** (`openai`)

## How AionUi Does It (Correct Approach)

### 1. Claude CLI Integration

**File:** `src/process/services/mcpServices/agents/ClaudeMcpAgent.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Detect Claude CLI
const { stdout } = await execAsync('claude mcp list', {
  timeout: 5000,
  env: { ...process.env, NODE_OPTIONS: '' },
});

// Install MCP server
await execAsync(`claude mcp add -s user "${serverName}" "${command}" -- ${args}`, {
  timeout: 5000,
});

// Remove MCP server
await execAsync(`claude mcp remove -s user "${serverName}"`, {
  timeout: 5000,
});
```

**Key Points:**
- ✅ Uses `claude` command directly from system PATH
- ✅ Uses `child_process.exec()` for execution
- ✅ Supports stdio transport only
- ✅ Uses scopes: `user`, `local`, `project`
- ❌ **NO** need for `@anthropic-ai/claude-agent-sdk` package
- ❌ **NO** need for custom Node.js scripts

### 2. Gemini CLI Integration

**File:** `src/process/services/mcpServices/agents/GeminiMcpAgent.ts`

```typescript
// Detect Gemini CLI
const { stdout } = await execAsync('gemini mcp list', {
  timeout: 5000,
});

// Install MCP server
await execAsync(`gemini mcp add "${serverName}" "${command}" ${args} -s user`, {
  timeout: 5000,
});

// Remove MCP server
await execAsync(`gemini mcp remove "${serverName}" -s user`, {
  timeout: 5000,
});
```

**Key Points:**
- ✅ Uses `gemini` command directly from system PATH
- ✅ Supports stdio, sse, http transports
- ✅ Uses scopes: `user`, `project`

## SwarmVille Implementation (Fixed)

### Before (❌ INCORRECT):

```rust
// DON'T DO THIS - Looking for a script that doesn't exist
fn is_claude_installed() -> bool {
    let script_path = project_root.join("scripts/claude-agent.mjs");
    script_path.exists()
}

// Executing non-existent script
Command::new("node")
    .arg(script_path)
    .arg(prompt)
    .output()
```

### After (✅ CORRECT):

```rust
// Check if Claude CLI is in system PATH
fn is_claude_installed() -> bool {
    Command::new("which")
        .arg("claude")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

// Execute Claude CLI directly
Command::new("claude")
    .arg(prompt)
    .output()
```

## Installation Requirements

### For Users:

1. **Install Claude Code CLI**
   ```bash
   # Install Claude Code (includes CLI)
   # https://docs.claude.com/en/docs/claude-code
   ```

2. **Install Gemini CLI** (optional)
   ```bash
   npm install -g @google/generative-ai-cli
   ```

3. **Install OpenAI CLI** (optional)
   ```bash
   pip install openai-cli
   ```

### For Developers:

SwarmVille doesn't need any SDK packages in `package.json`:
- ❌ Remove `@anthropic-ai/claude-agent-sdk` (not needed)
- ❌ Remove `scripts/claude-agent.mjs` (not needed)
- ✅ Just execute CLI commands directly

## MCP (Model Context Protocol) Integration

### How AionUi Manages MCP Servers:

```typescript
// List MCP servers
await execAsync('claude mcp list');
await execAsync('gemini mcp list');

// Add MCP server
await execAsync('claude mcp add -s user "server-name" "npx" -- "-y" "server-pkg"');
await execAsync('gemini mcp add "server-name" "npx" "-y" "server-pkg" -s user');

// Remove MCP server
await execAsync('claude mcp remove -s user "server-name"');
await execAsync('gemini mcp remove "server-name" -s user');
```

### Scopes:
- **user**: Global configuration (recommended for apps like SwarmVille/AionUi)
- **local**: Current directory
- **project**: Project-specific (Git repository)

## Error Handling

```typescript
try {
  const { stdout, stderr } = await execAsync(command, { timeout: 5000 });

  if (stderr && !stdout) {
    throw new Error(stderr);
  }

  return stdout;
} catch (error) {
  if (error.message.includes('not found')) {
    // CLI not installed
  } else if (error.message.includes('ANTHROPIC_API_KEY')) {
    // Authentication required
  } else if (error.message.includes('network')) {
    // Network error
  }
  throw error;
}
```

## Architecture Comparison

### ❌ What SwarmVille Was Doing (Wrong):

```
SwarmVille (Rust)
  → Node.js
    → scripts/claude-agent.mjs (doesn't exist ❌)
      → @anthropic-ai/claude-agent-sdk (not needed ❌)
```

### ✅ What AionUi Does (Correct):

```
AionUi (TypeScript)
  → child_process.exec()
    → `claude` CLI (from system PATH ✅)
```

### ✅ What SwarmVille Should Do (Fixed):

```
SwarmVille (Rust)
  → std::process::Command
    → `claude` CLI (from system PATH ✅)
```

## Testing

```bash
# Test if CLIs are installed
which claude  # Should show path like /usr/local/bin/claude
which gemini  # Should show path like /usr/local/bin/gemini

# Test CLI execution
claude --version
gemini --version

# Test MCP commands
claude mcp list
gemini mcp list
```

## References

- **AionUi Source Code**: https://github.com/iOfficeAI/AionUi
  - `src/process/services/mcpServices/agents/ClaudeMcpAgent.ts`
  - `src/process/services/mcpServices/agents/GeminiMcpAgent.ts`
- **Claude Code CLI Docs**: https://docs.claude.com/en/docs/claude-code
- **MCP Protocol**: https://modelcontextprotocol.io/

## Summary

✅ **Do:**
- Execute CLI commands directly from system PATH
- Use `child_process.exec()` (Node.js) or `std::process::Command` (Rust)
- Check CLI availability with `which <cli-name>`

❌ **Don't:**
- Create wrapper scripts (`scripts/claude-agent.mjs`)
- Install SDK packages for CLI integration
- Assume scripts exist without checking

---

**Updated:** 2025-11-08
**Status:** ✅ Fixed in SwarmVille
