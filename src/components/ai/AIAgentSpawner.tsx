/**
 * AI Agent Spawner Component
 *
 * Integrates Google Gemini to generate AI agent concepts and pixel art avatars.
 * Based on AI Studio reference implementation.
 */

import { useState } from "react";
import { getOrchestrator } from "@/lib/ai/gemini-orchestrator";
import { useAgentStore } from "@/stores/agentStore";
import { useSpaceStore } from "@/stores/spaceStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, User, Zap } from "lucide-react";
import { toast } from "sonner";

export function AIAgentSpawner() {
  const [idea, setIdea] = useState("");
  const [concept, setConcept] = useState<{
    name: string;
    role: string;
    visualPrompt: string;
    personality?: string;
    skills?: string[];
  } | null>(null);
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const { addNotification } = useAgentStore();
  const { selectedSpace, addAgent } = useSpaceStore();

  const handleGenerateConcept = async () => {
    if (!idea.trim()) {
      toast.error("Please enter an agent idea");
      return;
    }

    setIsGeneratingConcept(true);
    addNotification("Generating agent concept with Gemini...", "info");

    try {
      const orchestrator = getOrchestrator();
      const agentConcept = await orchestrator.generateAgentConcept(idea);

      setConcept(agentConcept);
      addNotification("Agent concept generated successfully!", "success");
      toast.success(`Created concept: ${agentConcept.name}`);
    } catch (error) {
      console.error("Error generating agent concept:", error);
      addNotification("Failed to generate agent concept", "error");
      toast.error("Failed to generate concept. Check API key.");
    } finally {
      setIsGeneratingConcept(false);
    }
  };

  const handleDeployAgent = async () => {
    if (!concept || !selectedSpace) return;

    setIsDeploying(true);
    addNotification(`Deploying ${concept.name} with pixel art...`, "info");

    try {
      const orchestrator = getOrchestrator();

      // Generate animated pixel art sprite
      const isAnimated = true;
      const frameCount = 4;
      const avatarBase64 = await orchestrator.generatePixelArt({
        prompt: concept.visualPrompt,
        isAnimated,
        frameCount,
        style: "retro",
      });

      const avatarUrl = `data:image/png;base64,${avatarBase64}`;

      // Load image to get dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = avatarUrl;
      });

      const frameWidth = img.width / frameCount;

      // Add agent to space
      const agentId = crypto.randomUUID();
      addAgent(selectedSpace.id, {
        id: agentId,
        name: concept.name,
        spaceId: selectedSpace.id,
        ownerId: "local-user",
        createdAt: Date.now(),
        position: {
          x: Math.floor(Math.random() * selectedSpace.dimensions.width),
          y: Math.floor(Math.random() * selectedSpace.dimensions.height),
        },
        role: "custom",
        model: {
          provider: "gemini",
          modelName: "gemini-1.5-flash",
          useUserCLI: false,
        },
        avatar: {
          icon: "🤖",
          color: "#6366f1",
          emoji: "🤖",
          spriteId: undefined,
        },
        state: "idle",
      });

      addNotification(`${concept.name} deployed successfully!`, "success");
      toast.success(`${concept.name} joined the space!`);

      // Reset form
      setConcept(null);
      setIdea("");
    } catch (error) {
      console.error("Error deploying agent:", error);
      addNotification("Failed to deploy agent", "error");
      toast.error("Failed to deploy agent");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Agent Spawner
        </CardTitle>
        <CardDescription>Generate and deploy AI agents with Gemini</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agent-idea">Agent Idea</Label>
          <Input
            id="agent-idea"
            placeholder="e.g., 'a wise cat wizard', 'cyberpunk hacker', 'friendly robot'"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={isGeneratingConcept || isDeploying}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerateConcept();
              }
            }}
          />
        </div>

        <Button
          onClick={handleGenerateConcept}
          disabled={!idea.trim() || isGeneratingConcept || isDeploying}
          className="w-full"
        >
          {isGeneratingConcept ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Concept...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              1. Generate Concept
            </>
          )}
        </Button>

        {concept && (
          <div className="p-4 space-y-3 border rounded-lg bg-muted/50">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 mt-1 text-primary" />
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-lg font-semibold">{concept.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">{concept.role}</p>
                </div>
                {concept.personality && (
                  <div>
                    <p className="text-sm font-medium">Personality</p>
                    <p className="text-sm text-muted-foreground">{concept.personality}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Visual Description</p>
                  <p className="text-sm text-muted-foreground">{concept.visualPrompt}</p>
                </div>
                {concept.skills && concept.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Skills</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {concept.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleDeployAgent}
              disabled={isDeploying || !selectedSpace}
              className="w-full"
              variant="default"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying Agent...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  2. Deploy Agent
                </>
              )}
            </Button>
          </div>
        )}

        {!selectedSpace && (
          <p className="text-sm text-center text-muted-foreground">
            Create a space first to deploy agents
          </p>
        )}
      </CardContent>
    </Card>
  );
}
