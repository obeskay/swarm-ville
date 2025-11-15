use serde::{Deserialize, Serialize};
use std::sync::Arc;

use super::{AgentConfig, AgentRuntime, Position};

/// Complex task that needs to be decomposed
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplexTask {
    pub task_id: String,
    pub description: String,
    pub space_id: String,
}

/// Subtask for an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubTask {
    pub task_id: String,
    pub agent_role: String,
    pub description: String,
    pub position: Position,
}

/// Task Orchestrator - decomposes complex tasks into agent subtasks
pub struct TaskOrchestrator {
    runtime: Arc<AgentRuntime>,
}

impl TaskOrchestrator {
    pub fn new(runtime: Arc<AgentRuntime>) -> Self {
        Self { runtime }
    }

    /// Decompose a complex task into subtasks using LLM
    pub async fn decompose_task(&self, task: &ComplexTask) -> Result<Vec<SubTask>, String> {
        // For now, use simple decomposition
        // In the future, this could use an LLM to intelligently decompose

        let description_lower = task.description.to_lowercase();

        if description_lower.contains("react") && description_lower.contains("página") {
            // React page generation task
            Ok(vec![
                SubTask {
                    task_id: format!("{}_research", task.task_id),
                    agent_role: "researcher".to_string(),
                    description: "Research 21st.dev components and Café Cursor event details".to_string(),
                    position: Position { x: 20, y: 20 },
                },
                SubTask {
                    task_id: format!("{}_design", task.task_id),
                    agent_role: "designer".to_string(),
                    description: "Design page layout and component structure for Café Cursor page".to_string(),
                    position: Position { x: 40, y: 20 },
                },
                SubTask {
                    task_id: format!("{}_frontend", task.task_id),
                    agent_role: "frontend_developer".to_string(),
                    description: "Implement React components using 21st.dev for Café Cursor event on Nov 15, 2025 in CDMX".to_string(),
                    position: Position { x: 60, y: 20 },
                },
                SubTask {
                    task_id: format!("{}_reviewer", task.task_id),
                    agent_role: "code_reviewer".to_string(),
                    description: "Review generated React code for quality and best practices".to_string(),
                    position: Position { x: 80, y: 20 },
                },
            ])
        } else {
            // Generic task decomposition
            Ok(vec![
                SubTask {
                    task_id: format!("{}_analyzer", task.task_id),
                    agent_role: "analyzer".to_string(),
                    description: format!("Analyze task: {}", task.description),
                    position: Position { x: 30, y: 30 },
                },
                SubTask {
                    task_id: format!("{}_executor", task.task_id),
                    agent_role: "executor".to_string(),
                    description: format!("Execute task: {}", task.description),
                    position: Position { x: 60, y: 30 },
                },
            ])
        }
    }

    /// Execute a complex task by spawning specialized agents
    pub async fn execute_complex_task(
        &self,
        task: ComplexTask,
        cli_type: &str,
    ) -> Result<Vec<String>, String> {
        tracing::info!("Orchestrating complex task: {}", task.description);

        // Decompose task into subtasks
        let subtasks = self.decompose_task(&task).await?;

        tracing::info!("Decomposed into {} subtasks", subtasks.len());

        let mut agent_ids = Vec::new();

        // Spawn an agent for each subtask
        for subtask in subtasks {
            let (provider, model) = match cli_type.to_lowercase().as_str() {
                "claude" | "claude-haiku" => ("claude", "claude-haiku-4-5-20251001"),
                "cursor" => ("cursor", "claude-3.5-sonnet"),
                "cursor-auto" => ("cursor", "auto"),
                _ => ("mock", "mock"),
            };

            let config = AgentConfig {
                name: format!("{} Agent", subtask.agent_role),
                role: subtask.agent_role.clone(),
                model_provider: provider.to_string(),
                model_name: model.to_string(),
                initial_position: subtask.position.clone(),
                space_id: task.space_id.clone(),
            };

            let agent_id = self.runtime.spawn_agent(config).await?;

            tracing::info!(
                "Spawned {} agent (ID: {}) for subtask: {}",
                subtask.agent_role,
                agent_id,
                subtask.description
            );

            // Assign the subtask to the agent
            self.runtime
                .assign_task_to_agent(&agent_id, subtask.task_id.clone(), subtask.description)
                .await?;

            agent_ids.push(agent_id);
        }

        tracing::info!(
            "Complex task orchestration complete. Spawned {} agents",
            agent_ids.len()
        );

        Ok(agent_ids)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_decompose_react_task() {
        let runtime = Arc::new(AgentRuntime::new(10));
        let orchestrator = TaskOrchestrator::new(runtime);

        let task = ComplexTask {
            task_id: "task_001".to_string(),
            description: "Generar página React con componentes de 21st.dev sobre Café Cursor"
                .to_string(),
            space_id: "space_001".to_string(),
        };

        let subtasks = orchestrator.decompose_task(&task).await.unwrap();

        assert_eq!(subtasks.len(), 4);
        assert!(subtasks[0].agent_role == "researcher");
        assert!(subtasks[1].agent_role == "designer");
        assert!(subtasks[2].agent_role == "frontend_developer");
        assert!(subtasks[3].agent_role == "code_reviewer");
    }
}
