#!/usr/bin/env node

/**
 * Agent Deployment Script
 * Deploy AI agents to SwarmVille workspace
 */

const WebSocket = require('ws');
const { program } = require('commander');

program
  .option('-t, --type <type>', 'Agent type (claude|gemini)', 'claude')
  .option('-n, --name <name>', 'Agent name', 'Agent-1')
  .option('-s, --space <id>', 'Space ID to join')
  .option('-u, --url <url>', 'WebSocket URL', 'ws://localhost:3001')
  .parse(process.argv);

const opts = program.opts();

class AgentDeployer {
  constructor(config) {
    this.config = config;
    this.ws = null;
    this.agentId = `agent_${Date.now()}`;
  }

  connect() {
    console.log(`🚀 Deploying ${this.config.type} agent: ${this.config.name}`);

    this.ws = new WebSocket(this.config.url);

    this.ws.on('open', () => {
      console.log('✅ Connected to SwarmVille server');
      this.joinSpace();
    });

    this.ws.on('message', (data) => {
      const msg = JSON.parse(data);
      this.handleMessage(msg);
    });

    this.ws.on('error', (error) => {
      console.error('❌ Connection error:', error.message);
    });

    this.ws.on('close', () => {
      console.log('🔌 Disconnected from server');
    });
  }

  joinSpace() {
    const spaceId = this.config.space || 'default-space';
    this.ws.send(JSON.stringify({
      type: 'join',
      spaceId,
      userId: this.agentId,
      userName: this.config.name,
      isAgent: true
    }));
    console.log(`📍 Joined space: ${spaceId}`);
  }

  handleMessage(msg) {
    switch(msg.type) {
      case 'user_joined':
        console.log(`👤 User joined: ${msg.userName}`);
        break;
      case 'position_update':
        // Agent receives position updates
        break;
      case 'task_assigned':
        console.log(`📋 Task assigned: ${msg.task}`);
        this.executeTask(msg.task);
        break;
      default:
        // console.log('📨 Message:', msg.type);
    }
  }

  async executeTask(task) {
    console.log(`⚙️ Executing task with ${this.config.type}...`);

    // TODO: Integrate with Claude Code or Gemini API
    // For now, just acknowledge
    setTimeout(() => {
      this.ws.send(JSON.stringify({
        type: 'task_complete',
        agentId: this.agentId,
        result: 'Task completed successfully'
      }));
      console.log('✅ Task completed');
    }, 2000);
  }

  move(x, y) {
    this.ws.send(JSON.stringify({
      type: 'position',
      x,
      y,
      direction: 'down'
    }));
  }
}

// Deploy agent
const deployer = new AgentDeployer(opts);
deployer.connect();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down agent...');
  process.exit(0);
});
