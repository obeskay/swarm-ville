/**
 * Achievement Notifications
 * Real-time toast notifications for achievements, level ups, and XP gains
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAchievementStore } from "@/stores/achievementStore";
import { X } from "lucide-react";

const notificationColors = {
  achievement: "from-amber-500 to-amber-600",
  level_up: "from-purple-500 to-purple-600",
  mission_complete: "from-green-500 to-green-600",
  xp_gained: "from-blue-500 to-blue-600",
};

export function AchievementNotifications() {
  const { notifications, dismissNotification } = useAchievementStore();

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        dismissNotification(notification.id);
      }, 5000);
      return () => clearTimeout(timer);
    });
  }, [notifications, dismissNotification]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            layout
            initial={{ opacity: 0, scale: 0.8, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 100 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto"
          >
            <div
              className={`relative overflow-hidden rounded-2xl shadow-lg backdrop-blur-md bg-gradient-to-r ${
                notificationColors[notification.type]
              } p-4`}
            >
              {/* Animated shine */}
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />

              <div className="relative flex items-start gap-3">
                {/* Icon */}
                <div className="text-3xl shrink-0">{notification.icon}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-white/90 text-xs line-clamp-2">
                    {notification.description}
                  </p>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
