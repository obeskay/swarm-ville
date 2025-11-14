extends Label
## Chat bubble that appears above avatars and fades out

var fade_duration: float = 0.3
var display_duration: float = 5.0  # How long to show before fading

func _ready() -> void:
	# Set initial appearance
	modulate.a = 1.0

	# Schedule fade-out
	await get_tree().create_timer(display_duration).timeout

	# Fade out
	var tween = create_tween()
	tween.tween_property(self, "modulate:a", 0.0, fade_duration)

	# Remove after fade
	await tween.finished
	queue_free()

func set_message(msg: String, speaker_name: String) -> void:
	"""Set the message text with speaker name"""
	self.text = "%s: %s" % [speaker_name, msg]
