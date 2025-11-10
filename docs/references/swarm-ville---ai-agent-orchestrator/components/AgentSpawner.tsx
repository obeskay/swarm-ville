import React, { useState } from 'react';
import { generateAgentConcept, generatePixelArt } from '../services/geminiService';
import { useGameStore } from '../stores/gameStore';

const AgentSpawner = () => {
  const [idea, setIdea] = useState('');
  const [concept, setConcept] = useState<{ name: string; role: string; visualPrompt: string } | null>(null);
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const addAgent = useGameStore((state) => state.addAgent);
  const addNotification = useGameStore((state) => state.addNotification);

  const handleGenerateConcept = async () => {
    if (!idea) return;
    setIsGeneratingConcept(true);
    addNotification('Generating agent concept...', 'info');
    try {
      const agentConcept = await generateAgentConcept(idea);
      setConcept(agentConcept);
      addNotification('Agent concept generated!', 'success');
    } catch (error) {
      console.error("Error generating agent concept:", error);
      addNotification('Failed to generate concept.', 'error');
    } finally {
      setIsGeneratingConcept(false);
    }
  };
  
  const handleDeployAgent = async () => {
      if (!concept) return;
      setIsDeploying(true);
      addNotification(`Deploying agent: ${concept.name}...`, 'info');
      try {
        const isAnimated = true;
        const frameCount = 4;
        const avatarBase64 = await generatePixelArt(concept.visualPrompt, isAnimated, frameCount);
        const avatarUrl = `data:image/png;base64,${avatarBase64}`;
        
        const img = new Image();
        img.onload = () => {
            addAgent({
                name: concept.name,
                role: concept.role,
                visualPrompt: concept.visualPrompt,
                avatar: avatarUrl,
                isAnimated,
                frameCount,
                frameWidth: img.width / frameCount,
            });
            addNotification(`${concept.name} deployed successfully!`, 'success');
            setConcept(null);
            setIdea('');
        };
        img.src = avatarUrl;

      } catch (error) {
          console.error("Error deploying agent:", error);
          addNotification('Failed to deploy agent.', 'error');
      } finally {
          setIsDeploying(false);
      }
  };

  return (
    <div style={{ border: '1px solid #444', borderRadius: '8px', padding: '1rem', backgroundColor: '#333842' }}>
      <h4>Manual Agent Spawner</h4>
      <p style={{fontSize: '0.9em', color: '#ccc', marginTop: 0}}>Quickly generate and deploy a single agent.</p>
      <input
        type="text"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Enter an agent idea (e.g., 'a cat wizard')"
        style={{ width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem', background: '#282c34', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
        disabled={isGeneratingConcept || isDeploying}
      />
      <button onClick={handleGenerateConcept} disabled={!idea || isGeneratingConcept || isDeploying}>
        {isGeneratingConcept ? 'Generating...' : '1. Generate Concept'}
      </button>

      {concept && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid #444', paddingTop: '1rem' }}>
          <h5>Generated Concept</h5>
          <p><strong>Name:</strong> {concept.name}</p>
          <p><strong>Role:</strong> {concept.role}</p>
          <p style={{fontSize: '0.9em'}}><strong>Visual Prompt:</strong> {concept.visualPrompt}</p>
          <button onClick={handleDeployAgent} disabled={isDeploying}>
            {isDeploying ? 'Deploying...' : '2. Deploy Agent'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentSpawner;
