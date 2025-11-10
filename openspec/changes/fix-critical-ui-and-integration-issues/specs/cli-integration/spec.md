# CLI Integration Capability

**Capability ID:** `cli-integration`
**Domain:** Agent Communication
**Status:** Modified

## Overview

This capability enables SwarmVille to execute external AI CLI tools (Claude, Gemini, OpenAI) to power agent conversations.

---

## MODIFIED Requirements

### REQ-CLI-001: Claude CLI Command Execution

**Priority:** Critical
**Rationale:** The current implementation uses an invalid `--prompt` flag that doesn't exist in Claude CLI.

The system must correctly execute Claude CLI commands using stdin pipe instead of invalid flags.

#### Scenario: User sends message to Claude agent

**Given** a Claude agent exists in the space
**And** the Claude CLI is installed and configured (`which claude` succeeds)
**When** the user sends a message "Hello, who are you?"
**Then** the system executes `echo "Hello, who are you?" | claude`
**And** the command runs with 30-second timeout
**And** the response from Claude appears in the chat within ≤ 30 seconds
**And** the message is properly escaped to prevent shell injection

#### Scenario: Command uses stdin instead of invalid flag

**Given** the backend is executing a Claude CLI command
**When** the command is constructed
**Then** it uses format: `sh -c "echo 'prompt' | claude"`
**And** it does NOT use `claude --prompt "..."`
**And** single quotes in prompt are escaped: `'\''`
**And** the command captures stdout and stderr separately

---

### REQ-CLI-002: CLI Error Handling

**Priority:** High
**Rationale:** Clear error messages help users diagnose and fix CLI configuration issues.

The system must provide clear error messages when CLI commands fail.

#### Scenario: Claude CLI not installed

**Given** the Claude CLI is not installed on the system
**When** the user sends a message to a Claude agent
**Then** an error message appears in the chat dialog:
"Claude CLI not found. Install it with: npm install -g @anthropic-ai/claude-cli"
**And** the error is logged to browser console with full details
**And** the agent returns to "idle" state

#### Scenario: Claude CLI execution fails

**Given** Claude CLI is installed but execution fails (network error, auth error, etc.)
**When** the command runs
**Then** an error message appears with the stderr output
**And** the error distinguishes between "not found" vs "execution failed"
**And** the user can retry without restarting the app

---

### REQ-CLI-003: CLI Response Timeout

**Priority:** High
**Rationale:** Prevent application hanging on long-running or stuck CLI commands.

Long-running CLI commands must timeout to prevent hanging.

#### Scenario: Claude CLI takes too long

**Given** a Claude agent receives a complex prompt
**When** the CLI command runs for more than 30 seconds
**Then** the command process is terminated (SIGTERM)
**And** an error message appears: "Request timed out. Please try a simpler prompt."
**And** the agent state changes from "thinking" to "idle"
**And** no partial response is shown

#### Scenario: Timeout is configurable

**Given** the system has a default timeout of 30 seconds
**When** a timeout occurs
**Then** the timeout duration is logged for debugging
**And** future versions can make timeout configurable per agent

---

### REQ-CLI-004: Empty Response Handling

**Priority:** Medium
**Rationale:** Handle edge cases where CLI succeeds but returns no output.

The system must handle cases where CLI returns successfully but with empty output.

#### Scenario: Claude CLI returns empty response

**Given** a Claude agent receives a message
**When** the CLI command succeeds (exit code 0)
**But** stdout is empty or contains only whitespace
**Then** an error message appears: "Received empty response from Claude. Please try again."
**And** the error is logged to console with full command details
**And** the agent returns to "idle" state
**And** the user can retry the message

---

## ADDED Requirements

### REQ-CLI-005: Shell Injection Prevention

**Priority:** Critical
**Rationale:** Prevent security vulnerabilities from malicious prompts.

User prompts must be properly escaped before passing to shell commands.

#### Scenario: User sends message with single quotes

**Given** the agent chat dialog is open
**When** user sends message: "What's the weather?"
**Then** the system escapes the apostrophe: `What'\''s the weather?`
**And** the CLI command executes without syntax errors
**And** the response is received normally

#### Scenario: User sends message with shell metacharacters

**Given** the agent chat dialog is open
**When** user sends message containing: `; ls -la`
**Then** the message is properly escaped
**And** the system does NOT execute `ls -la`
**And** the entire string is treated as the prompt

---

## Implementation Notes

**Files to Modify:**

- `src-tauri/src/cli/mod.rs` - Modify `execute_cli_command` function

**Current (Broken) Implementation:**

```rust
"claude" => Command::new("claude")
    .arg("--prompt")  // ❌ Invalid flag
    .arg(prompt)
    .output()
```

**Fixed Implementation:**

```rust
use tokio::time::{timeout, Duration};
use std::process::{Command, Stdio};

"claude" => {
    // Escape single quotes for shell
    let escaped = prompt.replace("'", "'\\''");

    let mut cmd = Command::new("sh");
    cmd.arg("-c")
       .arg(format!("echo '{}' | claude", escaped))
       .stdout(Stdio::piped())
       .stderr(Stdio::piped());

    // Add 30-second timeout
    let output = timeout(
        Duration::from_secs(30),
        cmd.output()
    ).await
     .map_err(|_| SwarmvilleError::Cli("Request timed out".into()))??;

    // Handle empty response
    let response = String::from_utf8(output.stdout)
        .map_err(|e| SwarmvilleError::Cli(format!("Invalid UTF-8: {}", e)))?;

    if response.trim().is_empty() {
        return Err(SwarmvilleError::Cli("Empty response".into()));
    }

    Ok(response.trim().to_string())
}
```

**Platform Compatibility:**

- macOS/Linux: Use `sh -c "echo ... | claude"`
- Windows: Use `cmd /c "echo ... | claude"` OR PowerShell
- Detection: Check `cfg!(windows)` at compile time

**Dependencies:**

- Requires `tokio` with `time` feature in `Cargo.toml`
- Existing `std::process::Command` is sufficient

## Related Requirements

- Depends on: Existing CLI detection in `detect_installed_clis()`
- Depends on: REQ-DIALOG-002 (agent chat must be interactive)
- Enables: Future Phase 5 requirements (multi-agent conversations)
- Blocks: Agent communication features until this is stable

## Acceptance Criteria

- [ ] User can send message to Claude agent successfully
- [ ] Response appears in chat within 30 seconds
- [ ] Command uses stdin pipe, NOT `--prompt` flag
- [ ] Single quotes in prompt are properly escaped
- [ ] Shell metacharacters don't cause command injection
- [ ] Timeout occurs after 30 seconds for long-running commands
- [ ] Error message shown when Claude CLI not installed
- [ ] Error message shown when command execution fails
- [ ] Error message shown when response is empty
- [ ] Agent returns to "idle" state after any error
- [ ] Console logs include full error details for debugging
