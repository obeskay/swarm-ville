import { useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useSpaceStore } from "../../stores/spaceStore";
import { motion, AnimatePresence } from "framer-motion";

const TILE_SIZE = 32;

interface DialogueBubblesProps {
  scale: number;
  cameraPosition: { x: number; y: number };
}

export function DialogueBubbles({
  scale,
  cameraPosition,
}: DialogueBubblesProps) {
  const { activeConversations, cleanupExpiredConversations } = useGameStore();
  const { agents } = useSpaceStore();

  // Cleanup expired conversations every second
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupExpiredConversations();
    }, 1000);

    return () => clearInterval(interval);
  }, [cleanupExpiredConversations]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {activeConversations.map((conversation) => {
          const agent = agents.get(conversation.agentId);
          if (!agent) return null;

          // Calculate screen position from world position
          const worldX = agent.position.x * TILE_SIZE;
          const worldY = agent.position.y * TILE_SIZE;
          const screenX = (worldX - cameraPosition.x) * scale + window.innerWidth / 2;
          const screenY = (worldY - cameraPosition.y) * scale + window.innerHeight / 2;

          // Position bubble above agent's head
          const bubbleX = screenX;
          const bubbleY = screenY - 60 * scale;

          return (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute pointer-events-none"
              style={{
                left: `${bubbleX}px`,
                top: `${bubbleY}px`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="relative">
                {/* Speech bubble */}
                <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-lg border-2 border-gray-200 dark:border-gray-700 max-w-[200px]">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-tight">
                    {conversation.text}
                  </p>
                </div>

                {/* Speech bubble tail */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderTop: "8px solid rgb(229 231 235)",
                  }}
                />
              </div>

              {/* Agent name tag */}
              <div className="mt-1 text-center">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded">
                  {agent.name}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
