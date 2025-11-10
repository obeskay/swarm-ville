/**
 * Thronglet Teaching Interface
 * Interactive word teaching and association builder
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { X, Plus, Trash2, Sparkles, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguageStore } from "@/stores/languageStore";

interface TeachingInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  onTeachWord?: (word: string, associations: string[]) => void;
}

export function TeachingInterface({
  isOpen,
  onClose,
  agentId,
  onTeachWord
}: TeachingInterfaceProps) {
  const [newWord, setNewWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [associations, setAssociations] = useState<string[]>([]);
  const [currentAssociation, setCurrentAssociation] = useState("");
  const [teaching, setTeaching] = useState(false);

  const { teachWord } = useLanguageStore();

  const handleAddAssociation = () => {
    if (!currentAssociation.trim()) {
      toast.error("Association cannot be empty");
      return;
    }

    if (associations.includes(currentAssociation.trim())) {
      toast.error("Association already added");
      return;
    }

    setAssociations([...associations, currentAssociation.trim()]);
    setCurrentAssociation("");
    toast.success("Association added");
  };

  const handleRemoveAssociation = (index: number) => {
    setAssociations(associations.filter((_, idx) => idx !== index));
  };

  const handleTeach = async () => {
    if (!newWord.trim()) {
      toast.error("Please enter a word to teach");
      return;
    }

    if (associations.length === 0) {
      toast.error("Please add at least one association");
      return;
    }

    setTeaching(true);

    try {
      // Call real backend API
      await teachWord({
        agent_id: agentId,
        word: newWord.trim(),
        associations,
        definition: definition.trim() || undefined,
        example: example.trim() || undefined,
      });

      // Call the teaching callback
      onTeachWord?.(newWord.trim(), associations);

      toast.success(`Successfully taught "${newWord}" with ${associations.length} associations! 🎉`);

      // Reset form
      setNewWord("");
      setDefinition("");
      setExample("");
      setAssociations([]);
      setTeaching(false);
      onClose();
    } catch (error) {
      toast.error(`Failed to teach word: ${error instanceof Error ? error.message : "Unknown error"}`);
      setTeaching(false);
    }
  };

  const handleReset = () => {
    setNewWord("");
    setDefinition("");
    setExample("");
    setAssociations([]);
    setCurrentAssociation("");
  };

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
          Teach New Word
        </DialogTitle>
        <DialogDescription>
          Teach your Thronglet a new word with associations
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 mt-4">
        {/* Word Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Word to Teach</label>
          <Input
            placeholder="e.g. happy, explore, create..."
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            disabled={teaching}
            className="text-base"
            autoFocus
          />
        </div>

        {/* Optional: Definition and Example */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-foreground/70">Definition (optional)</label>
            <Input
              placeholder="What does it mean?"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              disabled={teaching}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-foreground/70">Example (optional)</label>
            <Input
              placeholder="Usage example"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              disabled={teaching}
              className="text-sm"
            />
          </div>
        </div>

        {/* Associations Section */}
        <Card
          variant="blue"
          innerCorners="topLeft"
          spacing="generous"
          className="overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-foreground/10 pb-3">
              <Link2 className="w-4 h-4 text-foreground/70" />
              <h3 className="text-sm font-semibold">Word Associations</h3>
              <span className="ml-auto text-xs text-foreground/70">
                {associations.length} added
              </span>
            </div>

            {/* Add Association Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add association (e.g. joy, smile, sunshine...)"
                value={currentAssociation}
                onChange={(e) => setCurrentAssociation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddAssociation();
                  }
                }}
                disabled={teaching}
                className="text-sm flex-1"
              />
              <Button
                size="sm"
                variant="default"
                onClick={handleAddAssociation}
                disabled={teaching || !currentAssociation.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Associations List */}
            {associations.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto scroll-hidden">
                {associations.map((association, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-[calc(var(--radius)*0.5)] bg-background/50 hover:bg-background/70 transition-all shadow-soft"
                  >
                    <span className="text-sm font-medium">{association}</span>
                    <button
                      onClick={() => handleRemoveAssociation(idx)}
                      disabled={teaching}
                      className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {associations.length === 0 && (
              <div className="p-6 text-center text-sm text-foreground/50">
                No associations added yet. Add some to help your Thronglet learn!
              </div>
            )}
          </div>
        </Card>

        {/* Preview */}
        {newWord && associations.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
            <div className="text-xs text-muted-foreground mb-2">Preview:</div>
            <div className="space-y-2">
              <div className="text-base font-bold">{newWord}</div>
              <div className="text-sm text-foreground/70">
                Associated with: {associations.join(", ")}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={teaching}
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleTeach}
            disabled={teaching || !newWord.trim() || associations.length === 0}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {teaching ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Teaching...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Teach Word
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
