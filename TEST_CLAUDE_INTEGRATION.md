# SwarmVille - Claude Code CLI Integration Test

**Date**: November 11, 2025  
**Objective**: Test integration of Claude Code CLI with agent creation and interaction  
**Status**: Ready for Testing  

---

## Prerequisites

1. ✅ Backend running: `ws://localhost:8765`
2. ✅ Godot project initialized
3. ✅ Claude CLI available: `/opt/homebrew/bin/claude`
4. ✅ WASD controls implemented
5. ✅ Agent creation (SPACE key) implemented
6. ✅ Agent interaction (E key) implemented

---

## Architecture Overview

```
User Input (Godot)
    ↓
InputManager (handles WASD, SPACE, E)
    ↓
SpaceNode (processes input, creates agents)
    ↓
AgentRegistry (manages agent lifecycle)
    ↓
WebSocketClient (sends to backend)
    ↓
Backend (Tauri + Rust)
    ↓
Claude API / AI Integration
```

---

## Test 1: Agent Creation with Claude Context

**Goal**: Verify that agents created via SPACE can be enhanced with Claude descriptions

### Test Steps

1. **Create base agent**
   ```gdscript
   # In Godot, press SPACE
   # Agent spawned at random position
   ```

2. **Use Claude to enhance agent**
   ```bash
   # In terminal, test Claude integration
   echo "Create a creative name and personality for a game agent" | claude
   ```

3. **Apply enhancement**
   ```gdscript
   # Manually update agent properties with Claude output
   agent_data["name"] = "Claude-Generated Name"
   agent_data["description"] = "Claude-Generated Personality"
   ```

### Expected Results
- ✅ Agent is created at (x, y)
- ✅ Claude generates unique names/descriptions
- ✅ Agent updates with new data

---

## Test 2: Agent Interaction via Claude

**Goal**: Test that agent interactions use Claude for responses

### Test Steps

1. **Create agent** (Press SPACE in Godot)

2. **Send interaction** (Press E in Godot)
   ```gdscript
   # [SpaceNode] Sent interaction to agent: agent_12345
   ```

3. **Generate response with Claude**
   ```bash
   MESSAGE="Hello agent, how are you?"
   echo "$MESSAGE" | claude
   ```

4. **Verify response in chat**
   ```
   [Chat Panel]
   Player: "Hello from player!"
   Agent: [Claude-generated response]
   ```

### Expected Results
- ✅ Interaction signal sent to agent
- ✅ Claude generates contextual response
- ✅ Response appears in chat panel

---

## Test 3: Batch Agent Creation with Claude

**Goal**: Test creating multiple agents with diverse personalities via Claude

### Procedure

```bash
#!/bin/bash

# Generate 5 unique agent personalities
for i in {1..5}; do
  echo "Generate a unique game agent personality #$i" | claude
done
```

Then in Godot:
1. Press SPACE × 5 times
2. Each agent should be created
3. Assign Claude personalities to each

### Expected Results
- ✅ 5 agents spawn at different positions
- ✅ Each agent has unique Claude-generated personality
- ✅ Agents are distinguishable by name

---

## Test 4: Multi-Agent Conversation

**Goal**: Test interactions between multiple agents using Claude

### Procedure

1. Create 3 agents (SPACE × 3)
2. Agent A says: "Hello everyone"
3. Use Claude to generate responses from Agent B and C
4. Display multi-agent conversation in chat

### Expected Results
- ✅ Multiple agents visible on screen
- ✅ Chat shows multi-agent conversation
- ✅ Claude responses are contextual and different

---

## Technical Integration Points

### InputManager Signals
```gdscript
signal wasd_pressed(direction: Vector2)        # Camera movement
signal agent_creation_requested                 # SPACE key
signal agent_interaction_requested              # E key
```

### SpaceNode Handlers
```gdscript
func _on_agent_creation_requested() -> void
    # Creates agent with random position
    # Should also query Claude for name/personality

func _on_agent_interaction_requested() -> void
    # Sends message to nearest agent
    # Should query Claude for response
```

### WebSocketClient Integration
```gdscript
WebSocketClient.send_message({
    "type": "chat_message",
    "agent_id": agent_id,
    "text": message,
    "claude_context": true  # Flag to use Claude
})
```

---

## Test Results

### Test 1: Agent Creation with Claude
- Status: ⏳ Ready to test
- Steps:
  1. [ ] Create agent with SPACE
  2. [ ] Call Claude API for personality
  3. [ ] Update agent with response
- Result: [ ] Pass / [ ] Fail

### Test 2: Agent Interaction via Claude
- Status: ⏳ Ready to test
- Steps:
  1. [ ] Create agent with SPACE
  2. [ ] Press E to interact
  3. [ ] Call Claude for response
  4. [ ] Display in chat
- Result: [ ] Pass / [ ] Fail

### Test 3: Batch Agent Creation
- Status: ⏳ Ready to test
- Steps:
  1. [ ] Generate 5 personalities with Claude
  2. [ ] Create 5 agents with SPACE
  3. [ ] Assign personalities
- Result: [ ] Pass / [ ] Fail

### Test 4: Multi-Agent Conversation
- Status: ⏳ Ready to test
- Steps:
  1. [ ] Create 3 agents
  2. [ ] Generate multi-agent dialogue with Claude
  3. [ ] Display in chat
- Result: [ ] Pass / [ ] Fail

---

## Claude API Usage

### Simple Test
```bash
# Test if Claude CLI works
echo "Say 'SwarmVille is ready'" | /opt/homebrew/bin/claude
```

### Expected Output
```
SwarmVille is ready
```

### Integration Test
```bash
# Generate agent personality
PROMPT="Create a unique video game character with:
- A creative name
- A one-line personality description
- A role type (warrior, wizard, trader, explorer)
Respond in JSON format."

echo "$PROMPT" | /opt/homebrew/bin/claude
```

### Expected Output
```json
{
  "name": "Zephyr the Wanderer",
  "personality": "Curiosity drives every decision",
  "role": "explorer"
}
```

---

## Implementation Checklist

### Phase 1: Basic Integration ✅
- [x] WASD movement controls
- [x] Agent creation via SPACE
- [x] Agent interaction via E key
- [x] WebSocket message sending
- [x] Backend connection

### Phase 2: Claude Integration ⏳
- [ ] Query Claude API from GDScript
- [ ] Parse Claude responses
- [ ] Update agent properties dynamically
- [ ] Display responses in chat panel
- [ ] Handle API errors gracefully

### Phase 3: Advanced Features 🔮
- [ ] Agent personality system
- [ ] Multi-agent dialogue
- [ ] Agent memory/context
- [ ] Role-based behaviors
- [ ] Custom response templates

---

## Next Steps

1. **Confirm Claude CLI works**
   ```bash
   echo "test" | /opt/homebrew/bin/claude
   ```

2. **Implement Claude queries in GDScript**
   ```gdscript
   # In input_manager.gd or space_node.gd
   func call_claude(prompt: String) -> String:
       # Use OS.execute() to call Claude CLI
   ```

3. **Update agent creation to use Claude**
   ```gdscript
   func _on_agent_creation_requested() -> void:
       var claude_personality = call_claude("Generate agent personality")
       # Apply personality to agent_data
   ```

4. **Test full integration**
   - Create agent → Claude generates personality → Agent appears
   - Interact with agent → Claude generates response → Chat displays

---

## Debug Information

### Check Claude Installation
```bash
which claude                          # Location
claude --version                      # Version
echo "test" | claude                  # Functionality
```

### Check Godot Logs
```
tail -f /tmp/godot_run.log | grep claude
```

### Check WebSocket Communication
```
ws://localhost:8765
# Monitor: agent creation messages
# Monitor: chat message responses
```

---

## Success Criteria

✅ **All tests pass when**:
1. WASD moves camera smoothly
2. SPACE creates visible agents
3. E key sends messages to agents
4. Claude generates unique agent names
5. Claude generates contextual responses
6. Chat panel displays messages
7. No WebSocket errors
8. No Godot script errors

**Confidence Level**: ⭐⭐⭐⭐☆ (4/5)
- All prerequisites met
- Input system ready
- WebSocket verified
- Claude CLI available
- Just need to implement integration

---

**Created**: November 11, 2025  
**By**: Claude AI + Serena MCP  
**Status**: Ready for Testing
