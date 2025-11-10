/**
 * Beautiful space creation dialog
 * Inspired by gather-clone but with SwarmVille flair
 */

import { useState } from "react";
import { useSpaceStore } from "@/stores/spaceStore";
import { generateSpaceConfigWithName } from "@/lib/spaceGenerator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Sparkles,
  Building2,
  Trees,
  Home,
  Rocket,
  Users,
  Grid3x3,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SpaceCreationDialogProps {
  open: boolean;
  onClose: () => void;
}

type SpaceTemplate = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  theme: string;
  dimensions: { width: number; height: number };
  color: string;
};

const SPACE_TEMPLATES: SpaceTemplate[] = [
  {
    id: "office",
    name: "Startup Office",
    icon: <Building2 className="w-8 h-8" />,
    description: "Perfect for team collaboration",
    theme: "modern",
    dimensions: { width: 80, height: 80 },
    color: "#3b82f6",
  },
  {
    id: "garden",
    name: "Garden Oasis",
    icon: <Trees className="w-8 h-8" />,
    description: "Peaceful outdoor workspace",
    theme: "nature",
    dimensions: { width: 100, height: 100 },
    color: "#10b981",
  },
  {
    id: "cozy",
    name: "Cozy Home",
    icon: <Home className="w-8 h-8" />,
    description: "Warm and welcoming",
    theme: "home",
    dimensions: { width: 60, height: 60 },
    color: "#f59e0b",
  },
  {
    id: "spaceship",
    name: "Space Station",
    icon: <Rocket className="w-8 h-8" />,
    description: "Futuristic workspace",
    theme: "scifi",
    dimensions: { width: 120, height: 80 },
    color: "#8b5cf6",
  },
  {
    id: "conference",
    name: "Conference Hall",
    icon: <Users className="w-8 h-8" />,
    description: "Large meeting space",
    theme: "professional",
    dimensions: { width: 150, height: 100 },
    color: "#ef4444",
  },
  {
    id: "custom",
    name: "Custom Space",
    icon: <Grid3x3 className="w-8 h-8" />,
    description: "Design from scratch",
    theme: "modern",
    dimensions: { width: 80, height: 80 },
    color: "#6b7280",
  },
];

export function SpaceCreationDialog({ open, onClose }: SpaceCreationDialogProps) {
  const { addSpace } = useSpaceStore();
  const [spaceName, setSpaceName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<SpaceTemplate>(SPACE_TEMPLATES[0]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!spaceName.trim()) {
      toast.error("Give your space a name!");
      return;
    }

    setCreating(true);

    try {
      // Generate dynamic space configuration instead of hardcoded settings
      const spaceConfig = generateSpaceConfigWithName(spaceName.trim());
      const spaceId = crypto.randomUUID();

      addSpace({
        id: spaceId,
        name: spaceConfig.name,
        ownerId: "local-user",
        dimensions: spaceConfig.dimensions,
        tileset: {
          floor: spaceConfig.floor,
          theme: spaceConfig.theme,
        },
        tilemap: undefined,
        agents: [],
        settings: spaceConfig.settings,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      toast.success(`${spaceName} created! 🎉`, {
        description: `${spaceConfig.dimensions.width}×${spaceConfig.dimensions.height} ${spaceConfig.theme} workspace`,
      });

      setCreating(false);
      onClose();
    } catch (error) {
      toast.error("Failed to create space");
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogContent className="overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-sm opacity-70 transition-all duration-200 hover:opacity-100 hover:scale-110 active:scale-95 z-10 text-card-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Create Your Space
          </DialogTitle>
          <DialogDescription>
            Choose a template and customize your collaborative workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Space Name */}
          <div className="space-y-3">
            <Label htmlFor="space-name" className="text-sm font-semibold">
              Space Name
            </Label>
            <Input
              id="space-name"
              placeholder="e.g. Team HQ, Creative Studio, AI Lab..."
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              disabled={creating}
              className="h-12 text-base"
              autoFocus
            />
          </div>

          <Separator />

          {/* Template Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Choose Template</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SPACE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template)}
                  disabled={creating}
                  className={cn(
                    "relative p-5 rounded-xl text-left",
                    "transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "active:scale-[0.98]",
                    "group",
                    selectedTemplate.id === template.id
                      ? "bg-primary/10 border-2 border-primary shadow-lg ring-2 ring-primary/20"
                      : "bg-card border-2 border-border hover:border-primary/50 hover:shadow-md"
                  )}
                >
                  {/* Icon */}
                  <div
                    className="mb-3 transition-transform group-hover:scale-110"
                    style={{ color: template.color }}
                  >
                    {template.icon}
                  </div>

                  {/* Template Name */}
                  <div className="font-bold text-sm mb-2 text-foreground">
                    {template.name}
                  </div>

                  {/* Description */}
                  <div className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">
                    {template.description}
                  </div>

                  {/* Dimensions Badge */}
                  <Badge variant="secondary" className="text-xs font-medium">
                    {template.dimensions.width}×{template.dimensions.height}
                  </Badge>

                  {/* Selection Indicator */}
                  {selectedTemplate.id === template.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-200">
                      <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {spaceName && selectedTemplate && (
            <>
              <Separator />
              <div className="p-5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Preview
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-primary/20"
                    style={{ backgroundColor: selectedTemplate.color + "20", color: selectedTemplate.color }}
                  >
                    {selectedTemplate.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1">{spaceName}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      {selectedTemplate.name}
                      <Badge variant="secondary" className="text-xs">
                        {selectedTemplate.dimensions.width}×{selectedTemplate.dimensions.height}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={creating}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={creating || !spaceName.trim()}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            >
              {creating ? (
                <>
                  <span className="inline-block animate-spin mr-2">⚙️</span>
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Space
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
