extends Node
## Global game state manager

signal game_started
signal player_spawned(player_id: String)
signal score_changed(new_score: int)
signal wave_changed(wave_number: int)
signal game_over

var is_playing: bool = false
var player_agent_id: String = "player_0"
var current_score: int = 0
var current_wave: int = 1
var agents_defeated: int = 0
var time_played: float = 0.0

var game_config: Dictionary = {
	"difficulty": "normal",  # easy, normal, hard
	"max_agents": 10,
	"spawn_rate": 2.0,  # agents per second
}

func _ready() -> void:
	set_process(true)
	print("[GameState] Initialized")

func _process(delta: float) -> void:
	if is_playing:
		time_played += delta

func start_game() -> void:
	is_playing = true
	current_score = 0
	current_wave = 1
	agents_defeated = 0
	time_played = 0.0
	game_started.emit()
	player_spawned.emit(player_agent_id)
	print("[GameState] Game started!")

func end_game() -> void:
	is_playing = false
	game_over.emit()
	print("[GameState] Game over! Score: %d, Wave: %d" % [current_score, current_wave])

func add_score(points: int) -> void:
	current_score += points
	score_changed.emit(current_score)
	print("[GameState] Score: %d (+%d)" % [current_score, points])

func next_wave() -> void:
	current_wave += 1
	wave_changed.emit(current_wave)
	print("[GameState] Wave %d!" % current_wave)

func defeat_agent() -> void:
	agents_defeated += 1
	add_score(100)
	print("[GameState] Agent defeated! Total: %d" % agents_defeated)

func get_time_played_string() -> String:
	var minutes = int(time_played) / 60
	var seconds = int(time_played) % 60
	return "%02d:%02d" % [minutes, seconds]
