/**
 * Thronglet Language Learning Panel
 * Minimalist interface for vocabulary stats and teaching
 */

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { BookOpen, Brain, Sparkles, MessageSquare } from "lucide-react";

interface LanguageStats {
  vocabularySize: number;
  totalWordsTaught: number;
  recentWords: string[];
  isAutoTeachEnabled: boolean;
}

interface LanguagePanelProps {
  agentId: string;
  onTeachWord?: (word: string) => void;
  onToggleAutoTeach?: (enabled: boolean) => void;
}

export function LanguagePanel({
  agentId,
  onTeachWord,
  onToggleAutoTeach
}: LanguagePanelProps) {
  const [stats, setStats] = useState<LanguageStats>({
    vocabularySize: 0,
    totalWordsTaught: 0,
    recentWords: [],
    isAutoTeachEnabled: false,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Mock data for now - will integrate with actual language system
  useEffect(() => {
    // Simulate loading language stats
    setStats({
      vocabularySize: 42,
      totalWordsTaught: 156,
      recentWords: ["hello", "friend", "world", "learn", "grow"],
      isAutoTeachEnabled: true,
    });
  }, [agentId]);

  const handleToggleAutoTeach = () => {
    const newState = !stats.isAutoTeachEnabled;
    setStats(prev => ({ ...prev, isAutoTeachEnabled: newState }));
    onToggleAutoTeach?.(newState);
  };

  return (
    <div className="fixed right-6 top-6 z-20 select-none max-w-[360px]">
      {/* Compact Stats View */}
      <Card
        variant="yellow"
        spacing="generous"
        className="backdrop-blur-md transition-all duration-300"
      >
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold">Thronglet Language</div>
              <div className="text-xs text-foreground/70">
                {stats.vocabularySize} words learned
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? "−" : "+"}
          </Button>
        </div>

        {/* Expanded Stats View */}
        {isExpanded && (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Vocabulary Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-[calc(var(--radius)*0.66)] bg-background/50 shadow-soft">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-foreground/70" />
                  <span className="text-xs text-foreground/70">Vocabulary</span>
                </div>
                <div className="text-2xl font-bold">{stats.vocabularySize}</div>
              </div>

              <div className="p-4 rounded-[calc(var(--radius)*0.66)] bg-background/50 shadow-soft">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-foreground/70" />
                  <span className="text-xs text-foreground/70">Total Taught</span>
                </div>
                <div className="text-2xl font-bold">{stats.totalWordsTaught}</div>
              </div>
            </div>

            {/* Recent Words */}
            <div className="p-4 rounded-[calc(var(--radius)*0.66)] bg-background/30">
              <div className="text-xs font-semibold mb-3 text-foreground/70">
                Recent Words
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.recentWords.map((word, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-foreground/10 rounded-full text-xs font-medium hover:bg-foreground/20 transition-colors cursor-pointer"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Auto-Teach Toggle */}
            <div className="flex items-center justify-between p-4 rounded-[calc(var(--radius)*0.66)] bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Auto-Teach</span>
              </div>
              <Button
                size="sm"
                variant={stats.isAutoTeachEnabled ? "default" : "outline"}
                onClick={handleToggleAutoTeach}
              >
                {stats.isAutoTeachEnabled ? "ON" : "OFF"}
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="blue"
                className="flex-1"
                onClick={() => {
                  onTeachWord?.("");
                }}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Teach Words
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
