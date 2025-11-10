/**
 * Visual space card for grid display
 * Inspired by gather-clone realms
 */

import { useState } from "react";
import { Space } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Grid3x3,
  Play,
  Settings,
  MoreVertical,
  Trash2,
  Edit,
  Share2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SpaceCardProps {
  space: Space;
  agentCount?: number;
  isActive?: boolean;
  onJoin: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
}

const THEME_COLORS = {
  modern: "#3b82f6",
  nature: "#10b981",
  home: "#f59e0b",
  scifi: "#8b5cf6",
  professional: "#ef4444",
} as const;

export function SpaceCard({
  space,
  agentCount = 0,
  isActive = false,
  onJoin,
  onDelete,
  onEdit,
  onShare,
}: SpaceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const themeColor = THEME_COLORS[space.tileset.theme as keyof typeof THEME_COLORS] || "#6b7280";

  return (
    <div
      className={cn(
        "group relative p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:-translate-y-1",
        "active:scale-[0.98]",
        isActive
          ? "bg-primary/10 border-primary ring-2 ring-primary/30 shadow-lg"
          : "bg-card border-border hover:border-primary/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onJoin}
    >
      {/* Header with Actions */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110"
          style={{ backgroundColor: themeColor + "20", color: themeColor }}
        >
          <Building2 className="w-6 h-6" />
        </div>

        {(onDelete || onEdit || onShare) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Space
                </DropdownMenuItem>
              )}
              {onShare && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Space Info */}
      <div className="mb-4">
        <h3 className="font-bold text-lg mb-2 truncate group-hover:text-primary transition-colors">
          {space.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Grid3x3 className="w-4 h-4" />
          <span>{space.dimensions.width}×{space.dimensions.height}</span>
        </div>
      </div>

      {/* Agent Count */}
      <div className="flex items-center gap-2 mb-4">
        {agentCount > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">{agentCount}</span>
            <span className="text-xs">active</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Empty</span>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary" className="text-xs">
          {space.tileset.theme}
        </Badge>
        {isActive && (
          <Badge variant="default" className="text-xs">
            Active
          </Badge>
        )}
      </div>

      {/* Join Button (appears on hover) */}
      {isHovered && !isActive && (
        <Button
          size="sm"
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onJoin();
          }}
        >
          <Play className="w-4 h-4 mr-1" />
          Join
        </Button>
      )}
    </div>
  );
}
