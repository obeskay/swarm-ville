extends Node
## Test helper - spawns dummy agents for testing

func _ready() -> void:
	# Create test agents
	for i in range(3):
		var agent_data = {
			"id": "agent_%d" % i,
			"name": "Agent %d" % (i + 1),
			"position": {"x": 5 + i * 3, "y": 5},
			"role": "researcher",
			"state": "idle"
		}
		AgentRegistry.create_agent(agent_data)
		print("[TestAgentSpawner] Created agent %d" % i)
