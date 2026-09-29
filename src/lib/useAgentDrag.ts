import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { World } from "../world/World";

export interface Spot {
  x: number;
  z: number;
}

interface Options {
  getWorld: () => World | null;
  /** False until there is something to leave with the agent: an idea typed in. */
  ready: boolean;
  /** Called with where the agent was set down, or with nothing for a plain tap. */
  onDrop: (spot?: Spot) => void;
  /** The agent was picked up with nothing to carry. */
  onBlocked: () => void;
}

/** Pointer travel before a press becomes a drag; below it, it is a tap. */
const DRAG_THRESHOLD = 6;

/**
 * Picking up your agent and setting it down on the office floor. Built on
 * pointer events rather than HTML drag-and-drop so the same gesture works with
 * a finger, and so the world can show where it would land while you hold it.
 * The ghost that follows the pointer is moved straight on the DOM: React would
 * re-render on every move for no reason.
 */
export const useAgentDrag = ({ getWorld, ready, onDrop, onBlocked }: Options) => {
  const [dragging, setDragging] = useState(false);
  const ghost = useRef<HTMLDivElement>(null);
  const press = useRef<{ id: number; x: number; y: number; active: boolean } | null>(null);
  const spot = useRef<Spot | null>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const latest = useRef({ ready, onDrop, onBlocked });
  latest.current = { ready, onDrop, onBlocked };

  const stop = useCallback(() => {
    press.current = null;
    spot.current = null;
    document.body.classList.remove("is-dragging");
    getWorld()?.setDropPreview(null);
    setDragging(false);
  }, [getWorld]);

  // Never leave the page stuck holding a closed hand.
  useEffect(() => () => document.body.classList.remove("is-dragging"), []);

  // The ghost mounts a moment after the drag starts; put it under the pointer at once.
  useEffect(() => {
    if (dragging && ghost.current) ghost.current.style.transform = `translate(${pointer.current.x}px, ${pointer.current.y}px)`;
  }, [dragging]);

  // Escape puts the agent back.
  useEffect(() => {
    if (!dragging) return undefined;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && stop();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dragging, stop]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (!latest.current.ready) {
      latest.current.onBlocked();
      return;
    }
    press.current = { id: event.pointerId, x: event.clientX, y: event.clientY, active: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const current = press.current;
    if (!current || current.id !== event.pointerId) return;

    if (!current.active) {
      if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < DRAG_THRESHOLD) return;
      current.active = true;
      document.body.classList.add("is-dragging");
      setDragging(true);
    }

    pointer.current = { x: event.clientX, y: event.clientY };
    const node = ghost.current;
    if (node) node.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;

    // Only the bare floor takes a drop; a panel under the pointer does not.
    const over = document.elementFromPoint(event.clientX, event.clientY);
    const world = getWorld();
    spot.current = over?.classList.contains("stage") ? world?.dropSpot(event.clientX, event.clientY) ?? null : null;
    world?.setDropPreview(spot.current);
    if (node) node.dataset.state = spot.current ? "ready" : "away";
  };

  const finish = (event: ReactPointerEvent<HTMLElement>, drop: boolean) => {
    const current = press.current;
    if (!current || current.id !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);

    const landed = spot.current;
    const wasDrag = current.active;
    stop();
    if (!drop) return;
    if (!wasDrag) latest.current.onDrop();
    else if (landed) latest.current.onDrop(landed);
  };

  return {
    dragging,
    ghost,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => finish(event, true),
      onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => finish(event, false)
    }
  };
};
