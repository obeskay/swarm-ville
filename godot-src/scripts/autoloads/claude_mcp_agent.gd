extends Node
## Claude MCP Integration for Agent Collaboration
## Enables agents to make decisions and communicate via Claude AI

var claude_process: Process
var is_initialized: bool = false
var agent_conversations: Dictionary = {}  # agent_id -> conversation history
var pending_decisions: Dictionary = {}    # agent_id -> decision request

func _ready() -> void:
	print("[ClaudeMCPAgent] Initializing Claude integration...")
	set_process(true)

	# Try to start Claude process
	_initialize_claude()

func _initialize_claude() -> void:
	# Check if Claude CLI is available
	var result = OS.execute("which", ["claude"], [], true)

	if result == 0:
		print("[ClaudeMCPAgent] Claude CLI found - MCP integration available")
		is_initialized = true
	else:
		print("[ClaudeMCPAgent] Claude CLI not found - agent AI disabled")
		print("[ClaudeMCPAgent] Install: brew install anthropic-cli")

func _process(_delta: float) -> void:
	# Process any pending agent decisions
	_process_pending_decisions()

## Request Claude to generate agent decision
func request_agent_decision(agent_id: String, agent_state: Dictionary) -> String:
	if not is_initialized:
		return _fallback_agent_decision(agent_id, agent_state)

	var prompt = _build_agent_prompt(agent_id, agent_state)

	# Queue for async processing (would be async in real implementation)
	pending_decisions[agent_id] = {
		"prompt": prompt,
		"state": agent_state,
		"timestamp": Time.get_ticks_msec()
	}

	return "thinking"

## Build prompt for agent decision
func _build_agent_prompt(agent_id: String, state: Dictionary) -> String:
	var nearby_agents = state.get("nearby_agents", [])
	var position = state.get("position", Vector2.ZERO)
	var health = state.get("health", 100)

	var prompt = """You are an AI agent in SwarmVille collaborative space.

Agent ID: %s
Position: (%.0f, %.0f)
Health: %d
Nearby Agents: %d

Your task:
1. Analyze the current situation
2. Decide your next action (move, interact, rest)
3. Consider collaboration with nearby agents
4. Respond with a single JSON action

Respond ONLY with valid JSON like:
{"action": "move|interact|rest", "target": "x,y|agent_id|none", "reason": "brief explanation"}
""" % [agent_id, position.x, position.y, health, nearby_agents.size()]

	return prompt

## Process pending decisions using Claude
func _process_pending_decisions() -> void:
	for agent_id in pending_decisions.keys():
		var decision_data = pending_decisions[agent_id]
		var prompt = decision_data["prompt"]

		# Call Claude via MCP
		var decision = _call_claude(prompt)

		if decision:
			print("[ClaudeMCPAgent] Agent %s decision: %s" % [agent_id, decision])
			GameState.emit_signal("agent_decision", agent_id, decision)

		pending_decisions.erase(agent_id)

## Call Claude API
func _call_claude(prompt: String) -> String:
	if not is_initialized:
		return ""

	# Use claude command via CLI
	var output = []
	var error = OS.execute("claude", ["-m", prompt], output, false)

	if error == 0 and output.size() > 0:
		return output[0]

	return ""

## Fallback decision when Claude not available
func _fallback_agent_decision(_agent_id: String, state: Dictionary) -> String:
	# Simple rule-based fallback
	var health = state.get("health", 100)
	var nearby = state.get("nearby_agents", [])

	if health < 30:
		return '{"action": "rest", "target": "none", "reason": "low health"}'
	elif nearby.size() > 3:
		return '{"action": "interact", "target": "%s", "reason": "group nearby"}' % nearby[0]
	else:
		return '{"action": "move", "target": "random", "reason": "explore"}'

## Get agent conversation history
func get_agent_conversation(agent_id: String) -> Array:
	if not agent_conversations.has(agent_id):
		agent_conversations[agent_id] = []

	return agent_conversations[agent_id]

## Add message to agent conversation
func add_conversation_message(agent_id: String, message: String, is_agent: bool) -> void:
	if not agent_conversations.has(agent_id):
		agent_conversations[agent_id] = []

	agent_conversations[agent_id].append({
		"speaker": "agent" if is_agent else "player",
		"message": message,
		"timestamp": Time.get_ticks_msec()
	})

	print("[ClaudeMCPAgent] Message from %s: %s" % [agent_id, message])

## Generate agent response to player
func generate_agent_response(agent_id: String, player_message: String) -> String:
	if not is_initialized:
		return _fallback_response(agent_id)

	var conversation = get_agent_conversation(agent_id)
	var context = _build_conversation_context(agent_id, conversation)

	var prompt = """You are agent %s in SwarmVille.
Player said: "%s"

%s

Respond naturally in 1-2 sentences as this agent.""" % [agent_id, player_message, context]

	var response = _call_claude(prompt)

	if response:
		add_conversation_message(agent_id, response, true)
		return response

	return _fallback_response(agent_id)

func _build_conversation_context(agent_id: String, conversation: Array) -> String:
	var recent = conversation.slice(-3) if conversation.size() > 3 else conversation
	var context = ""

	for msg in recent:
		context += "%s: %s\n" % [msg["speaker"].to_upper(), msg["message"]]

	return context

func _fallback_response(agent_id: String) -> String:
	var responses = [
		"Hey there! How can I help?",
		"I'm working on exploring the space...",
		"Interested in collaborating?",
		"Check out my position on the map!",
		"Let's work together on this task."
	]

	var response = responses[randi() % responses.size()]
	add_conversation_message(agent_id, response, true)
	return response

## Check Claude MCP status
func get_status() -> Dictionary:
	return {
		"initialized": is_initialized,
		"agents_with_conversations": agent_conversations.size(),
		"pending_decisions": pending_decisions.size()
	}
