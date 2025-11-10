import React, { useState } from 'react';
import { orchestrateSwarmTask, generatePixelArt, generateAgentConcept } from '../services/geminiService';
import { useGameStore } from '../stores/gameStore';

const GeneratorPanel = () => {
  const [prompt, setPrompt] = useState('');
  const [useProModel, setUseProModel] = useState(false);
  const { setThinking, addAgent, addArtifact, addNotification } = useGameStore();

  const handleOrchestrate = async () => {
    if (!prompt) return;
    setThinking(true);
    addNotification('Orchestrating swarm task...', 'info');
    try {
      const functionCalls = await orchestrateSwarmTask(prompt, useProModel);
      
      addNotification(`Received ${functionCalls.length} tasks from orchestrator.`, 'info');

      for (const call of functionCalls) {
        if (call.name === 'deployAgent') {
          const { role, visualPrompt } = call.args;
          addNotification(`Deploying agent for role: ${role}`, 'info');
          try {
            const concept = await generateAgentConcept(role);
            const isAnimated = true;
            const frameCount = 4;
            const avatarBase64 = await generatePixelArt(visualPrompt, isAnimated, frameCount);
            const avatarUrl = `data:image/png;base64,${avatarBase64}`;

            const img = new Image();
            img.onload = () => {
                addAgent({
                    name: concept.name,
                    role,
                    visualPrompt,
                    avatar: avatarUrl,
                    isAnimated,
                    frameCount,
                    frameWidth: img.width / frameCount,
                });
                addNotification(`Agent ${concept.name} deployed!`, 'success');
            }
            img.src = avatarUrl;
          } catch(e) {
            console.error(`Failed to deploy agent for role ${role}`, e);
            addNotification(`Failed to deploy agent for role ${role}`, 'error');
          }
        } else if (call.name === 'createArtifact') {
          const { type, content, ownerRole } = call.args;
          addNotification(`Creating artifact for ${ownerRole}...`, 'info');
          addArtifact({ type, content, ownerRole });
          addNotification('Artifact created!', 'success');
        }
      }

    } catch (error) {
      console.error("Error orchestrating task:", error);
      addNotification('Orchestration failed.', 'error');
    } finally {
      setThinking(false);
    }
  };

  const isThinking = useGameStore(s => s.isThinking);

  return (
    <div style={{ border: '1px solid #444', borderRadius: '8px', padding: '1rem', backgroundColor: '#333842' }}>
      <h4>Task Orchestrator</h4>
      <p style={{fontSize: '0.9em', color: '#ccc', marginTop: 0}}>Describe a goal, and the AI will deploy agents and create artifacts to achieve it.</p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g., 'Create a simple python web server using Flask.'"
        rows={4}
        style={{ width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem', background: '#282c34', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
        disabled={isThinking}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={handleOrchestrate} disabled={!prompt || isThinking}>
          {isThinking ? 'Orchestrating...' : 'Run Orchestrator'}
        </button>
        <label style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={useProModel} onChange={(e) => setUseProModel(e.target.checked)} disabled={isThinking}/>
          Use Pro Model
        </label>
      </div>
    </div>
  );
};

export default GeneratorPanel;
