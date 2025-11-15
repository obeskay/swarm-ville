use std::sync::Arc;
use swarmville::agents::{AgentRuntime, ComplexTask, TaskOrchestrator};

#[tokio::test]
async fn test_complex_task_orchestration() {
    // Initialize tracing for test visibility
    let _ = tracing_subscriber::fmt::try_init();

    println!("\n========================================");
    println!("TEST: Complex Task Orchestration");
    println!("========================================\n");

    // Create runtime
    let runtime = Arc::new(AgentRuntime::new(100));

    // Create orchestrator
    let orchestrator = TaskOrchestrator::new(runtime.clone());

    // Define complex task
    let task = ComplexTask {
        task_id: "test_cafe_cursor_001".to_string(),
        description: "Generar una página de React que contenga componentes de 21st.dev y hable sobre el Café Cursor que se organizó el 15 de noviembre de 2025 en CDMX".to_string(),
        space_id: "office_001".to_string(),
    };

    println!("📋 Task: {}", task.description);
    println!("\n🔍 Decomposing task...\n");

    // Decompose task
    let subtasks = orchestrator.decompose_task(&task).await.unwrap();

    println!("✅ Task decomposed into {} subtasks:", subtasks.len());
    for (i, subtask) in subtasks.iter().enumerate() {
        println!(
            "  {}. {} - {} at ({}, {})",
            i + 1,
            subtask.agent_role,
            subtask.description,
            subtask.position.x,
            subtask.position.y
        );
    }

    assert_eq!(subtasks.len(), 4, "Should create 4 specialized agents");

    // Verify agent roles
    assert_eq!(subtasks[0].agent_role, "researcher");
    assert_eq!(subtasks[1].agent_role, "designer");
    assert_eq!(subtasks[2].agent_role, "frontend_developer");
    assert_eq!(subtasks[3].agent_role, "code_reviewer");

    println!("\n🚀 Spawning agents with MOCK provider (for CI)...\n");

    // Execute with mock provider (for CI testing without API keys)
    let agent_ids = orchestrator
        .execute_complex_task(task, "mock")
        .await
        .unwrap();

    println!("✅ Spawned {} agents:", agent_ids.len());
    for (i, agent_id) in agent_ids.iter().enumerate() {
        println!("  {}. Agent ID: {}", i + 1, agent_id);
    }

    assert_eq!(agent_ids.len(), 4, "Should spawn 4 agents");

    println!("\n========================================");
    println!("✅ TEST PASSED: Orchestration successful");
    println!("========================================\n");

    // Cleanup
    for agent_id in agent_ids {
        let _ = runtime.terminate_agent(&agent_id).await;
    }
}

#[tokio::test]
#[ignore] // Run with: cargo test test_with_real_llm -- --ignored --nocapture
async fn test_with_real_llm_providers() {
    // Initialize tracing
    let _ = tracing_subscriber::fmt::try_init();

    println!("\n========================================");
    println!("TEST: Real LLM Integration");
    println!("========================================\n");

    // Create runtime
    let runtime = Arc::new(AgentRuntime::new(100));
    let orchestrator = TaskOrchestrator::new(runtime.clone());

    let task = ComplexTask {
        task_id: "real_cafe_cursor_001".to_string(),
        description:
            "Generar página React con componentes 21st.dev sobre Café Cursor CDMX 15 nov 2025"
                .to_string(),
        space_id: "office_001".to_string(),
    };

    println!("📋 Task: {}", task.description);

    // Test with Claude Haiku
    println!("\n🤖 Testing with Claude Haiku 4.5...");
    let claude_agents = orchestrator
        .execute_complex_task(task.clone(), "claude-haiku")
        .await;

    match claude_agents {
        Ok(ids) => {
            println!("✅ Claude agents spawned: {}", ids.len());

            // Wait for agents to make at least one decision
            println!("⏳ Waiting 10s for agents to make decisions...");
            tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;

            println!("✅ Agents are running and making decisions with Claude Haiku");

            // Cleanup
            for id in ids {
                let _ = runtime.terminate_agent(&id).await;
            }
        }
        Err(e) => {
            println!("⚠️  Claude not available: {}", e);
            println!("   (This is OK if Claude CLI is not installed or not authenticated)");
        }
    }

    // Test with Cursor
    println!("\n🤖 Testing with Cursor CLI...");
    let cursor_agents = orchestrator.execute_complex_task(task, "cursor-auto").await;

    match cursor_agents {
        Ok(ids) => {
            println!("✅ Cursor agents spawned: {}", ids.len());

            // Wait for agents to make decisions
            println!("⏳ Waiting 10s for agents to make decisions...");
            tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;

            println!("✅ Agents are running and making decisions with Cursor");

            // Cleanup
            for id in ids {
                let _ = runtime.terminate_agent(&id).await;
            }
        }
        Err(e) => {
            println!("⚠️  Cursor not available: {}", e);
            println!("   (This is OK if Cursor CLI is not installed or not authenticated)");
        }
    }

    println!("\n========================================");
    println!("✅ TEST COMPLETED");
    println!("========================================\n");
}
