/// Debug test to see what Claude actually returns
#[tokio::test]
#[ignore]
async fn debug_claude_json_response() {
    use swarmville::agents::{
        AgentDecisionContext, AgentMemory, ClaudeProvider, LLMProvider, Position,
    };

    let provider = ClaudeProvider::new();

    if !provider.is_available().await {
        println!("Claude CLI not available, skipping test");
        return;
    }

    let context = AgentDecisionContext::from_agent(
        "test_id",
        "Test Agent",
        "researcher",
        &Position { x: 10, y: 10 },
        &AgentMemory::new(),
        None,
        vec![],
    );

    println!("\n=== PROMPT SENT TO CLAUDE ===");
    println!("{}", context.build_prompt());
    println!("\n=== END PROMPT ===\n");

    match provider.make_decision(&context).await {
        Ok(action) => {
            println!("✅ Successfully parsed action: {:?}", action);
        }
        Err(e) => {
            println!("❌ Failed to parse: {}", e);

            // Try to get raw response
            let prompt = context.build_prompt();
            match provider.generate_text(&prompt).await {
                Ok(text) => {
                    println!("\n=== RAW CLAUDE RESPONSE ===");
                    println!("{}", text);
                    println!("=== END RESPONSE ===\n");
                }
                Err(e2) => {
                    println!("Failed to get raw response: {}", e2);
                }
            }
        }
    }
}
