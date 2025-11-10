# Agent Deployment Guide

## Quick Deploy

### Claude Code Agent
```bash
# 1. Navigate to agent directory
cd src/lib/swarm

# 2. Start agent with Claude Code
claude-code --agent-mode --config agent-config.json

# 3. Agent auto-connects to WebSocket server
# ws://localhost:3001
```

### Gemini CLI Agent
```bash
# 1. Set API key
export GEMINI_API_KEY=your_key_here

# 2. Run agent script
node scripts/deploy-agent.js --type gemini --name "Agent-1"
```

## Agent Configuration

Create `.env`:
```env
VITE_GEMINI_API_KEY=your_key
WS_SERVER_URL=ws://localhost:3001
AGENT_AUTO_SPAWN=true
```

## Architecture

```
User Browser ←→ WebSocket Server ←→ AI Agents
                      ↓
                  SQLite DB
```

Agents connect via WebSocket and receive:
- Position updates
- User interactions
- Task assignments
- Space state changes

## Custom Agent Example

```typescript
import { AgentClient } from './lib/swarm/AgentClient';

const agent = new AgentClient({
  name: 'CodeHelper',
  spaceId: 'space-123',
  wsUrl: 'ws://localhost:3001'
});

agent.on('task', async (task) => {
  // Handle task
  const result = await processTask(task);
  agent.sendResult(result);
});

agent.connect();
```
