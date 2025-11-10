import { useEffect, useState, useRef, useMemo } from "react";
import { useAgentStore } from "../../stores/agentStore";
import { useSpaceStore } from "../../stores/spaceStore";
import { SimpleChatService } from "../../lib/ai/SimpleChatService";
import { Message } from "../../lib/types";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert } from "../ui/alert";
import { Loader2, Send, X, Bot, User } from "lucide-react";

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

  // Create a SimpleChatService instance for this agent's provider
  const chatService = useMemo(() => {
    if (!agent) return new SimpleChatService("gemini"); // Default fallback
    // Map provider to supported types (local/custom fallback to gemini)
    const provider =
      agent.model.provider === "local" || agent.model.provider === "custom"
        ? "gemini"
        : agent.model.provider;
    return new SimpleChatService(provider);
  }, [agent?.model.provider]);

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
      const startTime = Date.now();
      const response = await chatService.sendMessage(inputValue);
      const duration = Date.now() - startTime;

      const agentMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        agentId,
        role: "agent",
        content: response,
        timestamp: Date.now(),
        metadata: {
          modelInfo: {
            model: agent.model.modelName,
            duration,
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
        content: `Error: ${errorMsg}`,
        timestamp: Date.now(),
      };
      addMessage(agentId, errorMessage);
    } finally {
      setIsLoading(false);
      setAgentState(agentId, "idle");
    }
  };

  return (
    <Dialog open={true} onClose={onClose}>
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>

      <DialogHeader>
        <DialogTitle>{agent?.name || agentId}</DialogTitle>
        <DialogDescription>{agent?.role}</DialogDescription>
      </DialogHeader>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="flex flex-col h-[400px] gap-4">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Say hi
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "agent" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="text-sm">{msg.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1"
            autoFocus
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Dialog>
  );
}
