import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Agent, LogEvent } from "./shared";
import { formatClock } from "./shared";

interface Props {
  events: LogEvent[];
  agents: Agent[];
}

export const EventLog = ({ events, agents }: Props) => {
  const [open, setOpen] = useState(false);
  const byId = new Map(agents.map((agent) => [agent.id, agent]));

  return (
    <section className={`panel log ${open ? "log--open" : ""}`} aria-label="Event stream">
      <button type="button" className="log__toggle" onClick={() => setOpen((value) => !value)}>
        <span>Events <em>{events.length}</em></span>
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {open && (
        <ul className="log__list">
          {events.slice(0, 40).map((event) => {
            const agent = byId.get(event.agentId as Agent["id"]);
            return (
              <li key={event.id} className={`log__item log__item--${event.level}`}>
                <time>{formatClock(event.ts)}</time>
                <span className="log__who" style={{ color: agent?.accent }}>
                  {agent?.name ?? "system"}
                </span>
                <p>{event.text}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
