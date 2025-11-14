extends Resource
class_name AgentConfig
## Configuration for an AI agent in Swarm Ville

enum Role {
	RESEARCHER,    # Information gathering, analysis
	CODER,         # Code writing, refactoring
	DESIGNER,      # UI/UX, visual design
	PM,            # Project management, planning
	QA,            # Testing, quality assurance
	DEVOPS,        # Infrastructure, deployment
	CUSTOM         # User-defined role
}

enum ModelProvider {
	CLAUDE,        # Anthropic Claude (via claude CLI)
	CURSOR,        # Cursor AI (via cursor-agent CLI)
	OPENAI,        # OpenAI (via openai CLI)
	GEMINI,        # Google Gemini (via gemini CLI)
	LOCAL,         # Local models (ollama, etc.)
	CUSTOM         # Custom CLI
}

@export var id: String = ""
@export var name: String = "AI Agent"
@export var role: Role = Role.RESEARCHER
@export var avatar_sprite: Texture2D
@export var default_position: Vector2 = Vector2(24, 24)  # Grid position

# Model configuration
@export var model_provider: ModelProvider = ModelProvider.CLAUDE
@export var model_name: String = "claude-sonnet-4"
@export var use_user_cli: bool = true  # Use user's installed CLI (no API keys)
@export var custom_cli_command: String = ""  # For CUSTOM provider

# Behavior
@export var personality_prompt: String = ""
@export var skills: Array[String] = []
@export var max_context_tokens: int = 8000

# Visual
@export var color_tint: Color = Color.WHITE
@export var scale: float = 1.0

func _init() -> void:
	id = "agent_" + str(randi())

func get_cli_command() -> String:
	"""Get the CLI command for this agent's model provider"""
	match model_provider:
		ModelProvider.CLAUDE:
			return "claude"
		ModelProvider.CURSOR:
			return "cursor-agent"
		ModelProvider.OPENAI:
			return "openai"
		ModelProvider.GEMINI:
			return "gemini"
		ModelProvider.CUSTOM:
			return custom_cli_command
		_:
			return "claude"  # Default fallback

func get_display_name() -> String:
	"""Get formatted display name with role"""
	var role_name = Role.keys()[role]
	return "%s (%s)" % [name, role_name]
