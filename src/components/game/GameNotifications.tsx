/**
 * Game notifications for XP gains, level ups, achievements, etc.
 */

import { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Zap, TrendingUp, Trophy, CheckCircle2 } from "lucide-react";

interface Notification {
  id: string;
  type: "xp" | "levelup" | "achievement" | "mission";
  message: string;
  icon?: string;
  color?: string;
  duration?: number;
}

export function GameNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const addNotification = (notification: Notification) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newNotif = { ...notification, id };
      setNotifications((prev) => [...prev, newNotif]);

      // Auto-remove after duration
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, notification.duration || 3000);
    };

    // XP gained
    const handleXpGained = (event: CustomEvent) => {
      const { amount, reason } = event.detail;
      addNotification({
        id: "",
        type: "xp",
        message: `+${amount} XP${reason ? ` • ${reason}` : ""}`,
        color: "from-blue-500 to-cyan-500",
        duration: 2000,
      });
    };

    // Level up
    const handleLevelUp = (event: CustomEvent) => {
      const { level } = event.detail;
      addNotification({
        id: "",
        type: "levelup",
        message: `Level Up! Now level ${level}`,
        color: "from-yellow-500 to-orange-500",
        duration: 4000,
      });

      // Create confetti effect
      createConfetti();
    };

    // Achievement unlocked
    const handleAchievementUnlocked = (event: CustomEvent) => {
      const { achievement } = event.detail;
      addNotification({
        id: "",
        type: "achievement",
        message: achievement.title,
        icon: achievement.icon,
        color: getRarityColor(achievement.rarity),
        duration: 5000,
      });
    };

    // Mission completed
    const handleMissionComplete = (event: CustomEvent) => {
      const { mission } = event.detail;
      addNotification({
        id: "",
        type: "mission",
        message: `Mission Complete: ${mission.title}`,
        icon: mission.icon,
        color: "from-green-500 to-emerald-500",
        duration: 3000,
      });
    };

    window.addEventListener("xp-gained", handleXpGained as EventListener);
    window.addEventListener("level-up", handleLevelUp as EventListener);
    window.addEventListener(
      "achievement-unlocked",
      handleAchievementUnlocked as EventListener
    );
    window.addEventListener(
      "mission-complete",
      handleMissionComplete as EventListener
    );

    return () => {
      window.removeEventListener("xp-gained", handleXpGained as EventListener);
      window.removeEventListener("level-up", handleLevelUp as EventListener);
      window.removeEventListener(
        "achievement-unlocked",
        handleAchievementUnlocked as EventListener
      );
      window.removeEventListener(
        "mission-complete",
        handleMissionComplete as EventListener
      );
    };
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2 pointer-events-none select-none">
      {notifications.map((notif) => (
        <Card
          key={notif.id}
          className={`
            bg-gradient-to-r ${notif.color || "from-primary to-primary/80"}
            text-white shadow-2xl border-none
            animate-in slide-in-from-top-4 fade-in duration-300
            pointer-events-none
          `}
        >
          <div className="px-4 py-2 flex items-center gap-2">
            {notif.type === "xp" && <Zap className="w-4 h-4" />}
            {notif.type === "levelup" && <TrendingUp className="w-4 h-4" />}
            {notif.type === "achievement" && notif.icon && (
              <span className="text-lg">{notif.icon}</span>
            )}
            {notif.type === "achievement" && !notif.icon && (
              <Trophy className="w-4 h-4" />
            )}
            {notif.type === "mission" && notif.icon && (
              <span className="text-lg">{notif.icon}</span>
            )}
            {notif.type === "mission" && !notif.icon && (
              <CheckCircle2 className="w-4 h-4" />
            )}

            <span className="text-sm font-bold">{notif.message}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function getRarityColor(rarity: string): string {
  switch (rarity) {
    case "common":
      return "from-gray-400 to-gray-600";
    case "rare":
      return "from-blue-500 to-blue-700";
    case "epic":
      return "from-purple-500 to-purple-700";
    case "legendary":
      return "from-yellow-500 to-orange-600";
    default:
      return "from-primary to-primary/80";
  }
}

function createConfetti() {
  // Simple confetti effect using DOM elements
  const colors = ["#3b82f6", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6"];

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement("div");
    confetti.style.position = "fixed";
    confetti.style.width = "8px";
    confetti.style.height = "8px";
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    confetti.style.top = "50%";
    confetti.style.left = "50%";
    confetti.style.borderRadius = "50%";
    confetti.style.pointerEvents = "none";
    confetti.style.zIndex = "100";
    confetti.style.opacity = "0.8";

    document.body.appendChild(confetti);

    const angle = (Math.random() * Math.PI * 2);
    const velocity = 3 + Math.random() * 5;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 5; // Initial upward velocity

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let vyLocal = vy;

    const animate = () => {
      x += vx;
      y += vyLocal;
      vyLocal += 0.2; // Gravity

      confetti.style.left = `${x}px`;
      confetti.style.top = `${y}px`;

      if (y < window.innerHeight + 50) {
        requestAnimationFrame(animate);
      } else {
        confetti.remove();
      }
    };

    requestAnimationFrame(animate);
  }
}
