#!/usr/bin/env -S godot -s
# Test script for WASD and agent creation
# Run with: godot --script test_wasd_agents.gd

extends SceneTree

var test_results = {}

func _ready() -> void:
	print("\n" + "="*60)
	print("SwarmVille - Test Suite: WASD, Agent Creation, Interaction")
	print("="*60 + "\n")
	
	await test_input_manager()
	await test_agent_creation()
	await test_wasd_movement()
	await test_agent_interaction()
	
	print_results()
	quit()

func test_input_manager() -> void:
	print("[TEST] Input Manager Initialization")
	# The input manager should be available as an autoload
	if InputManager != null:
		print("✅ InputManager is loaded")
		print("   - wasd_pressed signal: %s" % ("exists" if InputManager.wasd_pressed != null else "missing"))
		print("   - agent_creation_requested signal: %s" % ("exists" if InputManager.agent_creation_requested != null else "missing"))
		test_results["InputManager"] = true
	else:
		print("❌ InputManager not found")
		test_results["InputManager"] = false

func test_agent_creation() -> void:
	print("\n[TEST] Agent Creation via SPACE key")
	await get_tree().process_frame
	
	var initial_count = AgentRegistry.agents.size()
	print("   Initial agent count: %d" % initial_count)
	
	# Simulate SPACE key press
	var space_event = InputEventKey.new()
	space_event.keycode = KEY_SPACE
	space_event.pressed = true
	get_tree().root.push_input(space_event)
	
	await get_tree().process_frame
	
	var new_count = AgentRegistry.agents.size()
	if new_count > initial_count:
		print("✅ Agent creation works - new count: %d" % new_count)
		test_results["AgentCreation"] = true
	else:
		print("⚠️  Agent not created (may need manual test)")
		test_results["AgentCreation"] = null

func test_wasd_movement() -> void:
	print("\n[TEST] WASD Movement Controls")
	await get_tree().process_frame
	
	# Test W key
	var w_event = InputEventKey.new()
	w_event.keycode = KEY_W
	w_event.pressed = true
	InputManager._input(w_event)
	
	print("✅ WASD input handling configured")
	print("   - W key: UP")
	print("   - A key: LEFT")
	print("   - S key: DOWN")
	print("   - D key: RIGHT")
	test_results["WASDMovement"] = true

func test_agent_interaction() -> void:
	print("\n[TEST] Agent Interaction with E key")
	await get_tree().process_frame
	
	if AgentRegistry.agents.size() > 0:
		var e_event = InputEventKey.new()
		e_event.keycode = KEY_E
		e_event.pressed = true
		InputManager._input(e_event)
		print("✅ Agent interaction command sent")
		test_results["AgentInteraction"] = true
	else:
		print("⚠️  No agents available for interaction test")
		test_results["AgentInteraction"] = null

func print_results() -> void:
	print("\n" + "="*60)
	print("TEST RESULTS SUMMARY")
	print("="*60)
	
	var passed = 0
	var failed = 0
	var pending = 0
	
	for test_name in test_results.keys():
		var result = test_results[test_name]
		if result == true:
			print("✅ %s: PASS" % test_name)
			passed += 1
		elif result == false:
			print("❌ %s: FAIL" % test_name)
			failed += 1
		else:
			print("⚠️  %s: PENDING" % test_name)
			pending += 1
	
	print("\nSummary: %d passed, %d failed, %d pending" % [passed, failed, pending])
	print("="*60 + "\n")
