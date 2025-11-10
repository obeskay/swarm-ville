import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { editPixelArt } from '../services/geminiService';
import { Agent } from '../types';

const GameHUD = () => {
    // This is a workaround to update the agent in the store.
    // A proper implementation would have a dedicated updateAgent action.
    const agents = useGameStore.getState().agents;
    const { selectedAgentId, selectedArtifactId, addNotification } = useGameStore();
    const [editPrompt, setEditPrompt] = React.useState('');
    const [isEditing, setIsEditing] = React.useState(false);

    const selectedAgent = selectedAgentId ? agents[selectedAgentId] : null;
    const selectedArtifact = useGameStore((state) => selectedAgentId ? null : (state.selectedArtifactId ? state.artifacts[state.selectedArtifactId] : null));

    const handleEdit = async () => {
        if (!selectedAgent || !editPrompt) return;
        setIsEditing(true);
        addNotification('Editing agent avatar...', 'info');
        try {
            const base64Data = selectedAgent.avatar.split(',')[1];
            const mimeType = selectedAgent.avatar.match(/data:([^;]+);/)?.[1] || 'image/png';
            
            const newAvatarBase64 = await editPixelArt(base64Data, mimeType, selectedAgent, editPrompt);
            
            const updatedAgent: Agent = { ...selectedAgent, avatar: `data:image/png;base64,${newAvatarBase64}` };
            useGameStore.setState(state => ({
                agents: {
                    ...state.agents,
                    [selectedAgent.id]: updatedAgent,
                }
            }));

            addNotification('Avatar edited successfully!', 'success');
        } catch (error) {
            console.error("Error editing avatar:", error);
            addNotification('Failed to edit avatar.', 'error');
        } finally {
            setIsEditing(false);
            setEditPrompt('');
        }
    };

    return (
        <div style={{ color: '#eee' }}>
            <h2>Details</h2>
            {selectedAgent && (
                <div>
                    <h3>Agent: {selectedAgent.name}</h3>
                    <p><strong>Role:</strong> {selectedAgent.role}</p>
                    <img src={selectedAgent.avatar} alt={selectedAgent.name} style={{ border: '2px solid #555', imageRendering: 'pixelated', width: '128px', backgroundColor: '#282c34' }} />
                    <p><strong>Visual Prompt:</strong></p>
                    <p style={{ fontSize: '0.8em', fontStyle: 'italic', wordBreak: 'break-word', backgroundColor: '#282c34', padding: '0.5rem', borderRadius: '4px' }}>{selectedAgent.visualPrompt}</p>

                    <div style={{ marginTop: '20px' }}>
                        <h4>Edit Avatar</h4>
                        <textarea 
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="Describe your edit..."
                            style={{ width: '100%', height: '60px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', boxSizing: 'border-box' }}
                            disabled={isEditing}
                        />
                        <button onClick={handleEdit} disabled={isEditing || !editPrompt} style={{ marginTop: '5px' }}>
                            {isEditing ? 'Editing...' : 'Apply Edit'}
                        </button>
                    </div>
                </div>
            )}
            {selectedArtifact && (
                <div>
                    <h3>Artifact</h3>
                    <p><strong>Type:</strong> {selectedArtifact.type}</p>
                    <p><strong>Owner Role:</strong> {selectedArtifact.ownerRole}</p>
                    <pre style={{ background: '#222', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '400px', overflowY: 'auto' }}>
                        <code>{selectedArtifact.content}</code>
                    </pre>
                </div>
            )}
            {!selectedAgent && !selectedArtifact && (
                <p>Click on an agent or artifact in the virtual office to see details.</p>
            )}
        </div>
    );
};

export default GameHUD;
