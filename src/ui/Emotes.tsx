import { useEffect, useRef } from "react";
import { EMOTES, glyphOf } from "../lib/emotes";
import { t } from "../lib/i18n";
import type { World } from "../world/World";

interface BarProps {
  onPick: (id: string) => void;
}

/** Five reactions, one tap each. The keys 1 to 5 do the same. */
export const EmoteBar = ({ onPick }: BarProps) => (
  <div className="emote-bar sq" role="group" aria-label={t("emote.label")}>
    {EMOTES.map((emote, index) => (
      <button key={emote.id} type="button" className="emote-btn" onClick={() => onPick(emote.id)} title={`${emote.glyph}  ${index + 1}`} aria-label={`${emote.id} (${index + 1})`}>
        {emote.glyph}
      </button>
    ))}
  </div>
);

export interface EmoteEvent {
  key: number;
  id: string;
  emote: string;
}

interface LayerProps {
  getWorld: () => World | null;
  events: EmoteEvent[];
}

/**
 * Reactions float up from a person's head. Like the video bubbles they hang
 * from the head's position in the world and are moved straight on the DOM;
 * the rising and fading is CSS.
 */
export const EmoteLayer = ({ getWorld, events }: LayerProps) => {
  const nodes = useRef(new Map<number, { element: HTMLElement; id: string }>());

  useEffect(() => {
    let frame = 0;
    const follow = () => {
      const world = getWorld();
      for (const { element, id } of nodes.current.values()) {
        const head = world?.headOf(id);
        element.style.visibility = head ? "visible" : "hidden";
        if (head) element.style.transform = `translate(${Math.round(head.x)}px, ${Math.round(head.y)}px)`;
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [getWorld]);

  return (
    <div className="emotes" aria-hidden>
      {events.map((event) => (
        <span
          key={event.key}
          className="emote"
          ref={(element) => {
            if (element) nodes.current.set(event.key, { element, id: event.id });
            else nodes.current.delete(event.key);
          }}
        >
          <i>{glyphOf(event.emote)}</i>
        </span>
      ))}
    </div>
  );
};
