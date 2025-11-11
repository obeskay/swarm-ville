/**
 * Level-Up Celebration Component
 * Epic animated celebration when player levels up
 */

import { useEffect, useState } from "react";
import { Zap, Star, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelUpCelebrationProps {
  newLevel: number;
  xpEarned: number;
  rewardsUnlocked?: string[];
  onClose: () => void;
}

const CONFETTI_COLORS = [
  "bg-blue-400", "bg-purple-400", "bg-pink-400", "bg-yellow-400", "bg-green-400", "bg-cyan-400"
];

export function LevelUpCelebration({
  newLevel,
  xpEarned,
  rewardsUnlocked,
  onClose
}: LevelUpCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-close after 8 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  // Generate confetti pieces
  const confetti = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
  }));

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 transition-opacity duration-300 z-40",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{
          backgroundColor: "var(--background-70)",
        }}
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
      />

      {/* Main celebration container */}
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center z-50 pointer-events-none",
          "transition-all duration-300"
        )}
      >
        {/* Confetti pieces */}
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className={cn(
              "absolute w-2 h-2 rounded-full animate-in fade-in",
              piece.color
            )}
            style={{
              left: `${piece.left}%`,
              top: "-20px",
              animation: `confetti-fall ${piece.duration}s linear forwards`,
              animationDelay: `${piece.delay}s`,
              pointerEvents: "none"
            }}
          />
        ))}

        {/* Center celebration card */}
        <div
          className={cn(
            "relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
            "border-2 border-purple-400/50 rounded-2xl p-8 max-w-md",
            "shadow-2xl shadow-purple-500/50",
            "animate-in zoom-in-75 duration-500",
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
          )}
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl animate-pulse" />

          {/* Content */}
          <div className="relative text-center space-y-6">
            {/* Level badge with animation */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg animate-pulse" />
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-in zoom-in-50 duration-500">
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-bold text-white drop-shadow-lg">
                      {newLevel}
                    </span>
                    <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                      Level Up
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                Level {newLevel} Reached!
              </h2>
              <p className="text-purple-200/80 text-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                You've unlocked incredible power
              </p>
            </div>

            {/* XP earned */}
            <div
              className="border border-purple-400/30 rounded-lg p-4 backdrop-blur animate-in fade-in scale-95 duration-500 delay-200"
              style={{ backgroundColor: "var(--foreground-5)" }}
            >
              <div className="flex items-center justify-center gap-2 text-yellow-300 mb-1">
                <Zap className="w-5 h-5" />
                <span className="font-bold text-lg">{xpEarned} XP Earned</span>
                <Zap className="w-5 h-5" />
              </div>
              <p className="text-xs text-purple-300/70">
                Keep up the amazing progress!
              </p>
            </div>

            {/* Rewards unlocked */}
            {rewardsUnlocked && rewardsUnlocked.length > 0 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <h3 className="text-sm font-semibold text-purple-200 flex items-center justify-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  New Achievements Unlocked
                  <Star className="w-4 h-4 text-yellow-400" />
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {rewardsUnlocked.slice(0, 3).map((reward, i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full px-3 py-1 text-xs text-purple-200 backdrop-blur animate-in fade-in scale-95 duration-300"
                      style={{ transitionDelay: `${400 + i * 100}ms` }}
                    >
                      ✨ {reward}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className={cn(
                "w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg",
                "hover:from-purple-600 hover:to-pink-600 transition-all duration-200",
                "hover:shadow-lg hover:shadow-purple-500/50 active:scale-95",
                "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500",
                "flex items-center justify-center gap-2"
              )}
            >
              <Crown className="w-5 h-5" />
              Continue Your Journey
            </button>

            {/* Press ESC hint */}
            <p className="text-xs text-purple-300/50 mt-4">
              Press ESC or click to dismiss
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
