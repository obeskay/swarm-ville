/**
 * Visual grid of spaces
 * Inspired by gather-clone realms menu
 */

import { useState } from "react";
import { useSpaceStore } from "@/stores/spaceStore";
import { SpaceCard } from "./SpaceCard";
import { SpaceCreationDialog } from "./SpaceCreationDialog";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function SpaceGrid() {
  const { spaces, currentSpaceId, setCurrentSpace, agents } = useSpaceStore();
  const [showCreation, setShowCreation] = useState(false);

  // Count agents per space
  const getAgentCount = (spaceId: string) => {
    return Array.from(agents.values()).filter((a) => a.spaceId === spaceId).length;
  };

  const handleJoinSpace = (spaceId: string) => {
    setCurrentSpace(spaceId);
    toast.success("Joined space!");
  };

  const handleDeleteSpace = (spaceId: string, spaceName: string) => {
    // TODO: Implement removeSpace in spaceStore
    toast.info("Delete functionality coming soon!");
  };

  const handleShareSpace = (spaceId: string, spaceName: string) => {
    const shareLink = `swarmville://space/${spaceId}`;
    navigator.clipboard.writeText(shareLink);
    toast.success("Share link copied!", {
      description: `Link for ${spaceName} copied to clipboard`,
    });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Spaces</h1>
          <p className="text-muted-foreground">
            {spaces.length === 0
              ? "Create your first space to get started"
              : `${spaces.length} workspace${spaces.length === 1 ? "" : "s"} available`}
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => setShowCreation(true)}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Space
        </Button>
      </div>

      {/* Grid or Empty State */}
      {spaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-soft">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">No spaces yet</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-md leading-relaxed">
            Spaces are collaborative workspaces where you and your AI agents work together.
            Create your first space to get started!
          </p>
          <Button
            size="lg"
            onClick={() => setShowCreation(true)}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Create First Space
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              agentCount={getAgentCount(space.id)}
              isActive={currentSpaceId === space.id}
              onJoin={() => handleJoinSpace(space.id)}
              onDelete={() => handleDeleteSpace(space.id, space.name)}
              onShare={() => handleShareSpace(space.id, space.name)}
            />
          ))}
        </div>
      )}

      {/* Creation Dialog */}
      <SpaceCreationDialog open={showCreation} onClose={() => setShowCreation(false)} />
    </div>
  );
}
