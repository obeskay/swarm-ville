import { useEffect, useRef, useState } from "react";
import { Bot, Megaphone, Send, Sparkles, User, X } from "lucide-react";
import type { Agent, AgentChatMessage } from "../types";
import { getArchetype, generateAgentResponse } from "../lib/archetypes";

interface Props {
  open: boolean;
  agent: Agent | null;
  projectName?: string;
  onClose: () => void;
  onSummon?: (agentId: string) => void;
  onAgentSpoke?: (agentId: string, text: string) => void;
}

export const AgentChatModal = ({
  open,
  agent,
  projectName,
  onClose,
  onSummon,
  onAgentSpoke
}: Props) => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const archetype = agent ? getArchetype(agent.id) : null;

  // Initialize greeting when opening modal with an agent
  useEffect(() => {
    if (!open || !agent || !archetype) return;

    // Default welcome message from this agent
    const greeting: AgentChatMessage = {
      id: `msg-init-${Date.now()}`,
      sender: "agent",
      agentId: agent.id,
      text: `¡Hola! Soy **${agent.name}** (${agent.role}). ${archetype.tagline} ¿En qué te puedo apoyar hoy?`,
      timestamp: Date.now()
    };
    setMessages([greeting]);
    setInput("");
    setIsTyping(false);

    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [open, agent?.id]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || !agent || !archetype) return null;

  const sendMessage = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) return;

    const userMsg: AgentChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      agentId: agent.id,
      text: trimmed,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // If user asked to come/summon
    if (
      trimmed.toLowerCase().includes("ven") ||
      trimmed.toLowerCase().includes("aquí") ||
      trimmed.toLowerCase().includes("llamar")
    ) {
      onSummon?.(agent.id);
    }

    // Simulate smart fast response
    setTimeout(() => {
      const replyText = generateAgentResponse(archetype, trimmed, projectName);
      const agentMsg: AgentChatMessage = {
        id: `msg-agent-${Date.now()}`,
        sender: "agent",
        agentId: agent.id,
        text: replyText,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);

      // Trigger speech bubble above character in game world
      const preview = replyText.replace(/\*\*(.*?)\*\*/g, "$1").split("\n")[0]?.slice(0, 35) ?? "¡Listo!";
      onAgentSpoke?.(agent.id, preview);
    }, 450);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div
      className="modal-layer"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="modal agent-chat-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <header className="agent-chat-modal__head">
          <div className="agent-chat-modal__profile">
            <span className="agent-chat-modal__avatar" style={{ background: agent.accent }}>
              <Bot size={20} color="#16140f" />
            </span>
            <div>
              <div className="agent-chat-modal__name-row">
                <h2>{agent.name}</h2>
                <span className="agent-chat-modal__badge" style={{ borderColor: agent.accent, color: agent.accent }}>
                  {agent.role}
                </span>
              </div>
              <p>{archetype.personality}</p>
            </div>
          </div>

          <div className="agent-chat-modal__actions">
            {onSummon && (
              <button
                type="button"
                className="agent-chat-modal__summon-btn"
                onClick={() => {
                  onSummon(agent.id);
                  sendMessage("¡Ven aquí conmigo!");
                }}
                title="Llamar al agente a tu ubicación"
              >
                <Megaphone size={13} />
                <span>Llamar</span>
              </button>
            )}
            <button type="button" className="icon" onClick={onClose} aria-label="Cerrar chat">
              <X size={17} />
            </button>
          </div>
        </header>

        {/* Quick Prompts Chips */}
        <div className="agent-chat-modal__quick-prompts">
          <span className="agent-chat-modal__prompts-label">
            <Sparkles size={11} /> Preguntas rápidas:
          </span>
          <div className="agent-chat-modal__chips-scroll">
            {archetype.quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="agent-chat-chip"
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="agent-chat-modal__messages" ref={scrollRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-bubble-row ${msg.sender === "user" ? "chat-bubble-row--user" : "chat-bubble-row--agent"}`}
            >
              <div className="chat-bubble-avatar">
                {msg.sender === "user" ? (
                  <User size={13} />
                ) : (
                  <Bot size={13} style={{ color: agent.accent }} />
                )}
              </div>
              <div
                className={`chat-bubble ${msg.sender === "user" ? "chat-bubble--user" : "chat-bubble--agent"}`}
                style={msg.sender === "agent" ? { borderLeftColor: agent.accent } : undefined}
              >
                {msg.text.split("\n").map((line, lIdx) => (
                  <p key={lIdx}>
                    {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-bubble-row chat-bubble-row--agent">
              <div className="chat-bubble-avatar">
                <Bot size={13} style={{ color: agent.accent }} />
              </div>
              <div className="chat-bubble chat-bubble--typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form className="agent-chat-modal__input-bar" onSubmit={handleFormSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Escribe un mensaje o pregunta a ${agent.name}…`}
            maxLength={350}
          />
          <button
            type="submit"
            className="agent-chat-modal__send-btn"
            disabled={!input.trim() || isTyping}
            aria-label="Enviar"
          >
            <Send size={15} />
          </button>
        </form>
      </section>
    </div>
  );
};
