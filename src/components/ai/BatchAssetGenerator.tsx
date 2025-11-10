/**
 * Batch Asset Generator
 * Generate multiple sprites/textures at once for creating asset packs
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  geminiSpriteGenerator,
  type GeneratedSprite,
} from "../../lib/ai/GeminiSpriteGenerator";
import { X, Sparkles, Download, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface BatchAssetGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchGenerated?: (sprites: GeneratedSprite[]) => void;
}

interface BatchItem {
  id: string;
  description: string;
  status: "pending" | "generating" | "completed" | "failed";
  result?: GeneratedSprite;
  error?: string;
}

export function BatchAssetGenerator({
  isOpen,
  onClose,
  onBatchGenerated,
}: BatchAssetGeneratorProps) {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchMode, setBatchMode] = useState<"list" | "bulk">("list");
  const [bulkInput, setBulkInput] = useState("");

  const addBatchItem = () => {
    if (!currentInput.trim()) return;

    const newItem: BatchItem = {
      id: crypto.randomUUID(),
      description: currentInput.trim(),
      status: "pending",
    };

    setBatchItems([...batchItems, newItem]);
    setCurrentInput("");
  };

  const addBulkItems = () => {
    const descriptions = bulkInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const newItems: BatchItem[] = descriptions.map((desc) => ({
      id: crypto.randomUUID(),
      description: desc,
      status: "pending" as const,
    }));

    setBatchItems([...batchItems, ...newItems]);
    setBulkInput("");
  };

  const removeBatchItem = (id: string) => {
    setBatchItems(batchItems.filter((item) => item.id !== id));
  };

  const generateBatch = async () => {
    if (batchItems.length === 0) {
      toast.error("Add at least one description to generate");
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    const results: GeneratedSprite[] = [];

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];

      // Update status to generating
      setBatchItems((prev) =>
        prev.map((b) =>
          b.id === item.id ? { ...b, status: "generating" } : b
        )
      );

      try {
        console.log(`[${i + 1}/${batchItems.length}] Generating: ${item.description}`);

        const sprite = await geminiSpriteGenerator.generateSprite({
          characterDescription: item.description,
          style: "pixel-art",
          size: 192,
          allowFallback: false, // No fallback in batch - we want real generation
          retryAttempts: 2, // Fewer retries in batch to move faster
        });

        results.push(sprite);

        // Update status to completed
        setBatchItems((prev) =>
          prev.map((b) =>
            b.id === item.id
              ? { ...b, status: "completed", result: sprite }
              : b
          )
        );

        toast.success(`Generated: ${item.description}`);
      } catch (error) {
        console.error(`Failed to generate: ${item.description}`, error);

        const errorMsg =
          error instanceof Error
            ? error.message
            : "Unknown error";

        // Update status to failed
        setBatchItems((prev) =>
          prev.map((b) =>
            b.id === item.id
              ? { ...b, status: "failed", error: errorMsg }
              : b
          )
        );

        toast.error(`Failed: ${item.description}`);
      }

      // Update progress
      const newProgress = ((i + 1) / batchItems.length) * 100;
      setProgress(newProgress);
    }

    setIsGenerating(false);

    if (results.length > 0) {
      toast.success(`Batch complete! Generated ${results.length}/${batchItems.length} sprites`);
      onBatchGenerated?.(results);
    } else {
      toast.error("All generations failed");
    }
  };

  const downloadAll = () => {
    const completed = batchItems.filter((item) => item.status === "completed");

    completed.forEach((item, index) => {
      if (item.result) {
        setTimeout(() => {
          geminiSpriteGenerator.saveSprite(item.result!);
        }, index * 100); // Stagger downloads
      }
    });

    toast.success(`Downloading ${completed.length} sprites`);
  };

  const clearAll = () => {
    setBatchItems([]);
    setProgress(0);
  };

  const completedCount = batchItems.filter((item) => item.status === "completed").length;
  const failedCount = batchItems.filter((item) => item.status === "failed").length;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-all duration-200 hover:opacity-100 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none touch-manipulation z-10"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>

      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Batch Asset Generator
        </DialogTitle>
        <DialogDescription>
          Generate multiple sprites at once for asset packs
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 mt-4">
        {/* Mode Selector */}
        <Select value={batchMode} onValueChange={(v) => setBatchMode(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">Add One by One</SelectItem>
            <SelectItem value="bulk">Bulk Add (Multi-line)</SelectItem>
          </SelectContent>
        </Select>

        {/* Input Area */}
        {batchMode === "list" ? (
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Knight with red cape"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  addBatchItem();
                }
              }}
              disabled={isGenerating}
            />
            <Button
              onClick={addBatchItem}
              disabled={isGenerating || !currentInput.trim()}
              size="icon"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder={`One description per line, e.g.:\nKnight with red cape\nWizard with purple robes\nNinja with katana`}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={6}
              disabled={isGenerating}
            />
            <Button
              onClick={addBulkItems}
              disabled={isGenerating || !bulkInput.trim()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add All
            </Button>
          </div>
        )}

        {/* Batch List */}
        {batchItems.length > 0 && (
          <Card variant="blue" spacing="generous">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
                <h3 className="text-sm font-semibold">
                  Batch Queue ({batchItems.length})
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearAll}
                  disabled={isGenerating}
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto scroll-hidden">
                {batchItems.map((item) => (
                  <div
                    key={item.id}
                    className={`
                      p-3 rounded-[calc(var(--radius)*0.5)]
                      bg-background/50 transition-all
                      ${item.status === "completed" ? "border-2 border-green-500" : ""}
                      ${item.status === "failed" ? "border-2 border-red-500" : ""}
                      ${item.status === "generating" ? "border-2 border-blue-500 animate-pulse" : ""}
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {item.description}
                        </div>
                        <div className="text-xs text-foreground/70 mt-1">
                          {item.status === "pending" && "Waiting..."}
                          {item.status === "generating" && "Generating..."}
                          {item.status === "completed" && "✓ Complete"}
                          {item.status === "failed" && `✗ Failed: ${item.error}`}
                        </div>
                      </div>

                      {item.status === "pending" && (
                        <button
                          onClick={() => removeBatchItem(item.id)}
                          disabled={isGenerating}
                          className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {item.status === "completed" && item.result && (
                        <img
                          src={item.result.imageData}
                          alt={item.description}
                          className="w-12 h-12 border border-border rounded"
                          style={{ imageRendering: "pixelated" }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Generating...</span>
              <span>
                {completedCount}/{batchItems.length}
              </span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Stats */}
        {!isGenerating && batchItems.length > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-2 rounded bg-muted/50">
              <div className="font-semibold">{completedCount}</div>
              <div className="text-xs text-foreground/70">Completed</div>
            </div>
            <div className="p-2 rounded bg-muted/50">
              <div className="font-semibold">{failedCount}</div>
              <div className="text-xs text-foreground/70">Failed</div>
            </div>
            <div className="p-2 rounded bg-muted/50">
              <div className="font-semibold">{batchItems.length}</div>
              <div className="text-xs text-foreground/70">Total</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {completedCount > 0 && !isGenerating && (
            <Button
              variant="outline"
              onClick={downloadAll}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          )}

          <Button
            onClick={generateBatch}
            disabled={isGenerating || batchItems.length === 0}
            className={completedCount > 0 ? "flex-1" : "w-full"}
          >
            {isGenerating ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Generating... ({completedCount}/{batchItems.length})
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Batch
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
