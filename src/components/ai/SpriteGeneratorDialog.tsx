import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  geminiSpriteGenerator,
  type SpriteGenerationOptions,
  type GeneratedSprite,
} from "../../lib/ai/GeminiSpriteGenerator";
import {
  spriteGeneratorSchema,
  type SpriteGeneratorFormData,
} from "../../lib/validations/schemas";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Loader2, Sparkles, X, Check } from "lucide-react";
import { toast } from "sonner";

interface SpriteGeneratorDialogProps {
  onClose: () => void;
  onSpriteGenerated?: (sprite: GeneratedSprite) => void;
}

export default function SpriteGeneratorDialog({
  onClose,
  onSpriteGenerated,
}: SpriteGeneratorDialogProps) {
  const [generatedSprite, setGeneratedSprite] =
    useState<GeneratedSprite | null>(null);

  // Handle ESC key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      // Prevent WASD keys from propagating to game controls
      if (["w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  const form = useForm<SpriteGeneratorFormData>({
    resolver: zodResolver(spriteGeneratorSchema),
    defaultValues: {
      description: "",
    },
  });

  const handleGenerate = async (data: SpriteGeneratorFormData) => {
    try {
      const options: SpriteGenerationOptions = {
        characterDescription: data.description,
        style: "pixel-art",
        size: 192,
        removeBackground: true,
        cropTight: true,
        allowFallback: true, // Allow fallback in UI, but will try real generation first
        retryAttempts: 3, // Retry 3 times before fallback
      };

      const sprite = await geminiSpriteGenerator.generateSprite(options);
      setGeneratedSprite(sprite);

      // Check if fallback was used
      if (sprite.metadata.style.includes("fallback")) {
        toast.warning("Using existing sprite (generation failed). Try again or adjust description.");
      } else {
        toast.success("Sprite generated successfully with AI! 🎨");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to generate sprite";
      toast.error(errorMsg);
    }
  };

  const handleUse = () => {
    if (!generatedSprite) return;
    if (onSpriteGenerated) {
      onSpriteGenerated(generatedSprite);
    }
    onClose();
  };

  const examplePrompts = [
    "Knight with red cape",
    "Wizard with purple robes",
    "Ninja with katana",
    "Ninja with katana green lime",
  ];

  return (
    <Dialog open={true} onClose={onClose}>
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
      </button>

      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Pick Character
        </DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4">
          {/* Example Prompts */}
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => {
                  form.setValue("description", prompt);
                  form.handleSubmit(handleGenerate)();
                }}
              >
                {prompt}
              </Badge>
            ))}
          </div>

          {/* Description Input */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="or custom..."
                    rows={2}
                    {...field}
                    disabled={form.formState.isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !form.formState.isSubmitting) {
                        e.preventDefault();
                        form.handleSubmit(handleGenerate)();
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preview */}
          {generatedSprite && (
            <Card className="border-primary/30">
              <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3">
                <img
                  src={generatedSprite.imageData}
                  alt="Generated sprite"
                  className="w-48 h-48 border border-border rounded"
                  style={{ imageRendering: "pixelated" }}
                />
                <p className="text-xs text-muted-foreground">
                  Character #{generatedSprite.characterId}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <DialogFooter>
            {!generatedSprite ? (
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGeneratedSprite(null)}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button type="button" onClick={handleUse} className="flex-1">
                  <Check className="mr-2 h-4 w-4" />
                  Use This
                </Button>
              </div>
            )}
          </DialogFooter>
        </form>
      </Form>
    </Dialog>
  );
}
