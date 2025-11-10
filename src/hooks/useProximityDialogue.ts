import { useEffect, useRef } from "react";
import { useSpaceStore } from "../stores/spaceStore";
import { useGameStore } from "../stores/gameStore";
import {
  generateDialogue,
  areAgentsInProximity,
} from "../lib/ai/DialogueService";

const PROXIMITY_CHECK_INTERVAL = 2000; // Check every 2 seconds
const CONVERSATION_COOLDOWN = 30000; // 30 seconds cooldown between conversations for same pair

export function useProximityDialogue() {
  const { agents } = useSpaceStore();
  const { addConversation } = useGameStore();
  const lastConversationRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      const agentList = Array.from(agents.values());

      // Check all pairs of agents for proximity
      for (let i = 0; i < agentList.length; i++) {
        for (let j = i + 1; j < agentList.length; j++) {
          const agent1 = agentList[i];
          const agent2 = agentList[j];

          // Create a unique key for this agent pair
          const pairKey = [agent1.id, agent2.id].sort().join("|");

          // Check cooldown
          const lastConversation = lastConversationRef.current.get(pairKey) || 0;
          const now = Date.now();

          if (now - lastConversation < CONVERSATION_COOLDOWN) {
            continue;
          }

          // Check if agents are in proximity
          if (areAgentsInProximity(agent1.position, agent2.position)) {
            // Record this conversation time
            lastConversationRef.current.set(pairKey, now);

            // Generate dialogue
            generateDialogue(
              agent1.name,
              agent1.role,
              agent2.name,
              agent2.role
            ).then((dialogue) => {
              // Add each message to the conversation store with a delay
              dialogue.forEach((message, index) => {
                setTimeout(() => {
                  const speakerId =
                    message.speaker === agent1.name ? agent1.id : agent2.id;
                  addConversation(speakerId, message.text);
                }, index * 2000); // 2 second delay between messages
              });
            });
          }
        }
      }
    }, PROXIMITY_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [agents, addConversation]);
}
