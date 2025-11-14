extends Node
## Global agent registry - manages all AI agents in Swarm Ville
## Autoload singleton

var agents: Dictionary = {}  # agent_id -> AgentState
var active_swarms: Dictionary = {}  # swarm_id -> Array[agent_id]

signal agent_registered(agent_id: String, agent_state: AgentState)
signal agent_unregistered(agent_id: String)
signal swarm_created(swarm_id: String, agent_ids: Array)
signal swarm_disbanded(swarm_id: String)

func _ready() -> void:
	print("[AgentRegistry] Initialized - ready to register agents")

func register_agent(config: AgentConfig) -> AgentState:
	"""Register a new agent and return its state"""
	var agent_state = AgentState.new(config)
	agents[config.id] = agent_state

	emit_signal("agent_registered", config.id, agent_state)
	print("[AgentRegistry] Registered agent: %s (ID: %s)" % [config.name, config.id])

	return agent_state

func unregister_agent(agent_id: String) -> void:
	"""Remove an agent from the registry"""
	if agents.has(agent_id):
		var agent_state = agents[agent_id]
		agents.erase(agent_id)

		# Remove from all swarms
		for swarm_id in active_swarms.keys():
			var swarm_agents: Array = active_swarms[swarm_id]
			if swarm_agents.has(agent_id):
				swarm_agents.erase(agent_id)

		emit_signal("agent_unregistered", agent_id)
		print("[AgentRegistry] Unregistered agent: %s" % agent_id)

		agent_state.queue_free()

func get_agent(agent_id: String) -> AgentState:
	"""Get agent state by ID"""
	return agents.get(agent_id, null)

func get_all_agents() -> Array[AgentState]:
	"""Get all registered agents"""
	var result: Array[AgentState] = []
	for agent_state in agents.values():
		result.append(agent_state)
	return result

func get_agents_by_role(role: AgentConfig.Role) -> Array[AgentState]:
	"""Get all agents with specific role"""
	var result: Array[AgentState] = []
	for agent_state in agents.values():
		if agent_state.config.role == role:
			result.append(agent_state)
	return result

func create_swarm(swarm_id: String, agent_ids: Array) -> bool:
	"""Create a swarm from multiple agents"""
	# Validate all agents exist
	for agent_id in agent_ids:
		if not agents.has(agent_id):
			print("[AgentRegistry] ERROR: Agent %s not found" % agent_id)
			return false

	active_swarms[swarm_id] = agent_ids.duplicate()
	emit_signal("swarm_created", swarm_id, agent_ids)
	print("[AgentRegistry] Created swarm '%s' with %d agents" % [swarm_id, agent_ids.size()])

	return true

func disband_swarm(swarm_id: String) -> void:
	"""Disband a swarm"""
	if active_swarms.has(swarm_id):
		active_swarms.erase(swarm_id)
		emit_signal("swarm_disbanded", swarm_id)
		print("[AgentRegistry] Disbanded swarm: %s" % swarm_id)

func get_swarm_agents(swarm_id: String) -> Array[AgentState]:
	"""Get all agents in a swarm"""
	var result: Array[AgentState] = []
	if active_swarms.has(swarm_id):
		for agent_id in active_swarms[swarm_id]:
			if agents.has(agent_id):
				result.append(agents[agent_id])
	return result

func get_agent_count() -> int:
	"""Get total number of registered agents"""
	return agents.size()

func get_swarm_count() -> int:
	"""Get total number of active swarms"""
	return active_swarms.size()

func create_demo_agents() -> void:
	"""Create demo agents for testing"""
	# Researcher agent
	var researcher_config = AgentConfig.new()
	researcher_config.id = "agent_researcher_demo"
	researcher_config.name = "Research Bot"
	researcher_config.role = AgentConfig.Role.RESEARCHER
	researcher_config.default_position = Vector2(20, 20)
	researcher_config.model_provider = AgentConfig.ModelProvider.CLAUDE
	researcher_config.personality_prompt = "You are a thorough researcher who loves gathering and analyzing information."
	register_agent(researcher_config)

	# Coder agent
	var coder_config = AgentConfig.new()
	coder_config.id = "agent_coder_demo"
	coder_config.name = "Code Wizard"
	coder_config.role = AgentConfig.Role.CODER
	coder_config.default_position = Vector2(25, 20)
	coder_config.model_provider = AgentConfig.ModelProvider.CLAUDE
	coder_config.personality_prompt = "You are an expert coder who writes clean, efficient code."
	register_agent(coder_config)

	# PM agent
	var pm_config = AgentConfig.new()
	pm_config.id = "agent_pm_demo"
	pm_config.name = "Project Lead"
	pm_config.role = AgentConfig.Role.PM
	pm_config.default_position = Vector2(22, 22)
	pm_config.model_provider = AgentConfig.ModelProvider.CLAUDE
	pm_config.personality_prompt = "You are a strategic project manager who excels at planning and coordination."
	register_agent(pm_config)

	print("[AgentRegistry] Created 3 demo agents")
