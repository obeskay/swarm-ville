import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useAgentStore } from "../../stores/agentStore";
import { useSpaceStore } from "../../stores/spaceStore";
import { sendMessageToCLI, getCliDisplayName } from "../../lib/cli";
import { Message } from "../../lib/types";
import "./AgentDialog.css";

interface AgentDialogProps {
  agentId: string;
  onClose: () => void;
}

export default function AgentDialog({ agentId, onClose }: AgentDialogProps) {
  const { getMessages, addMessage, setAgentState } = useAgentStore();
  const { agents } = useSpaceStore();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = getMessages(agentId);

  const agent = Array.from(agents.values()).find((a) => a.id === agentId);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !agent) return;

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
    setError(null);
    setAgentState(agentId, "thinking");

    try {
      // Send to CLI
      const response = await sendMessageToCLI(agent.model.provider, inputValue);

      const agentMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        agentId,
        role: "agent",
        content: response,
        timestamp: Date.now(),
        metadata: {
          modelInfo: {
            model: agent.model.modelName,
            duration: Math.random() * 5000,
          },
        },
      };
      addMessage(agentId, agentMessage);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);

      const errorMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        agentId,
        role: "agent",
        content: `Error: ${errorMsg}. Make sure ${getCliDisplayName(agent.model.provider)} CLI is installed and configured.`,
        timestamp: Date.now(),
      };
      addMessage(agentId, errorMessage);
    } finally {
      setIsLoading(false);
      setAgentState(agentId, "idle");
    }
  };

  return (
    <div className="agent-dialog-overlay">
      <div className="agent-dialog">
        <div className="dialog-header">
          <div className="header-info">
            <h3>{agent?.name || agentId}</h3>
            <p className="agent-model">
              {agent?.model.provider} • {agent?.role}
            </p>
          </div>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        {error && <div className="dialog-error">{error}</div>}

        <div className="dialog-messages">
          {messages.length === 0 && (
            <div className="empty-messages">
              Start a conversation with {agent?.name || "this agent"}
            </div>
          )}
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
              <div className="message-loading">
                <span className="loader"></span> Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="dialog-input-area">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="dialog-input"
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="send-btn"
            title={
              isLoading ? "Waiting for response..." : "Send message (Enter)"
            }
          >
            {isLoading ? "…" : "→"}
          </button>
        </form>
      </div>
    </div>
  );
}
