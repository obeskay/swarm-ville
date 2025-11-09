import { useEffect, useCallback } from "react";
import { useSpaceStore } from "../stores/spaceStore";
import { Position } from "../lib/types";

const TILE_SIZE = 32;

export function useProximity(proximityRadius: number = 5) {
  const { userPosition, agents } = useSpaceStore();

  const calculateDistance = useCallback((pos1: Position, pos2: Position) => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getNearbyAgents = useCallback(() => {
    const nearby: string[] = [];
    agents.forEach((agent) => {
      const distance = calculateDistance(userPosition, agent.position);
      if (distance <= proximityRadius) {
        nearby.push(agent.id);
      }
    });
    return nearby;
  }, [userPosition, agents, proximityRadius, calculateDistance]);

  useEffect(() => {
    const nearbyAgents = getNearbyAgents();
    // TODO: Trigger STT activation when agents are nearby
    console.log("Nearby agents:", nearbyAgents);
  }, [getNearbyAgents]);

  return {
    nearbyAgents: getNearbyAgents(),
    calculateDistance,
  };
}
