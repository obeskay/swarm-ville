import { useEffect, useState } from "react";
import { useAgentStore } from "../../stores/agentStore";
import { Message } from "../../lib/types";
import "./AgentDialog.css";

interface AgentDialogProps {
  agentId: string;
  onClose: () => void;
}

export default function AgentDialog({ agentId, onClose }: AgentDialogProps) {
  const { getMessages, addMessage, setAgentState } = useAgentStore();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messages = getMessages(agentId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      agentId,
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };

    addMessage(agentId, userMessage);
    setInputValue("");
    setIsLoading(true);
    setAgentState(agentId, "thinking");

    // TODO: Send to CLI connector
    setTimeout(() => {
      const agentMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        agentId,
        role: "agent",
        content: "This is a test response from the agent.",
        timestamp: Date.now(),
        metadata: {
          modelInfo: {
            model: "claude-3-5-sonnet",
            duration: 150,
          },
        },
      };
      addMessage(agentId, agentMessage);
      setIsLoading(false);
      setAgentState(agentId, "idle");
    }, 1000);
  };

  return (
    <div className="agent-dialog-overlay">
      <div className="agent-dialog">
        <div className="dialog-header">
          <h3>{agentId}</h3>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <div className="dialog-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message message-${msg.role}`}>
              <div className="message-content">{msg.content}</div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message message-agent">
              <div className="message-loading">Thinking...</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="dialog-input-area">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="dialog-input"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="send-btn"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
