import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { User, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

// 84 character sprites available (Character_001.png to Character_083.png)
const CHARACTERS = Array.from({ length: 83 }, (_, i) => ({
  id: i + 1,
  name: `Character ${String(i + 1).padStart(3, "0")}`,
  path: `/sprites/characters/Character_${String(i + 1).padStart(3, "0")}.png`,
}));

interface CharacterSelectorProps {
  onSelect: (characterPath: string) => void;
  onClose: () => void;
}

export function CharacterSelector({ onSelect, onClose }: CharacterSelectorProps) {
  const [selectedId, setSelectedId] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const frameRef = useRef(0);

  const selectedChar = CHARACTERS.find((c) => c.id === selectedId)!;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    frameRef.current = 0;

    const img = new Image();
    img.onload = () => {
      const FRAMES = 4;
      const FRAME_WIDTH = 48;
      const FRAME_HEIGHT = 48;
      const PREVIEW_SCALE = 4;

      const animateFrame = () => {
        // Dark gradient background
        const gradient = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          0,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width / 2
        );
        gradient.addColorStop(0, "hsl(240 10% 12%)");
        gradient.addColorStop(1, "hsl(240 10% 6%)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw subtle grid pattern
        ctx.strokeStyle = "hsla(240, 10%, 20%, 0.3)";
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 20) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }

        const frameIndex = Math.floor((frameRef.current / 10) % FRAMES);
        const displayWidth = FRAME_WIDTH * PREVIEW_SCALE;
        const displayHeight = FRAME_HEIGHT * PREVIEW_SCALE;
        const x = (canvas.width - displayWidth) / 2;
        const y = (canvas.height - displayHeight) / 2 + 10;

        // Glow effect behind character
        ctx.shadowColor = "hsl(var(--primary))";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "hsla(var(--primary), 0.1)";
        ctx.beginPath();
        ctx.ellipse(
          canvas.width / 2,
          y + displayHeight - 10,
          displayWidth / 2 + 10,
          20,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        // Shadow under character
        ctx.fillStyle = "hsla(0, 0%, 0%, 0.3)";
        ctx.beginPath();
        ctx.ellipse(
          canvas.width / 2,
          y + displayHeight - 5,
          displayWidth / 3,
          10,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          img,
          frameIndex * FRAME_WIDTH,
          0,
          FRAME_WIDTH,
          FRAME_HEIGHT,
          x,
          y,
          displayWidth,
          displayHeight
        );

        frameRef.current++;
        animationRef.current = requestAnimationFrame(animateFrame);
      };

      animateFrame();
    };
    img.src = selectedChar.path;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [selectedId, selectedChar.path]);

  const handleConfirm = () => {
    onSelect(selectedChar.path);
    toast.success("Character selected!", {
      icon: <Sparkles className="w-4 h-4" />,
      duration: 2000,
    });
    onClose();
  };

  const handlePrev = () => {
    setSelectedId((prev) => (prev === 1 ? CHARACTERS.length : prev - 1));
  };

  const handleNext = () => {
    setSelectedId((prev) => (prev === CHARACTERS.length ? 1 : prev + 1));
  };

  return (
    <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50 backdrop-blur-md p-4">
      <Card className="w-full max-w-sm overflow-hidden bg-card/95 border-border/50 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Choose Your Character</h2>
              <p className="text-xs text-muted-foreground">Select an avatar for your agent</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Preview Canvas with navigation */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={240}
              height={240}
              className="w-full rounded-lg border border-border/50"
              style={{ imageRendering: "pixelated" }}
            />

            {/* Navigation arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80"
              onClick={handlePrev}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80"
              onClick={handleNext}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            {/* Character name badge */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <Badge variant="secondary" className="font-mono">
                #{selectedId.toString().padStart(2, "0")} - {selectedChar.name}
              </Badge>
            </div>
          </div>

          {/* Character Grid */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">All Characters</p>
            <ScrollArea className="h-24">
              <div className="grid grid-cols-9 gap-1.5 pr-2">
                {CHARACTERS.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedId(char.id)}
                    className={`
                      aspect-square rounded-md text-xs font-mono font-medium
                      transition-all duration-150
                      ${
                        selectedId === char.id
                          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                          : "bg-muted hover:bg-accent text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    {char.id}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Skip
            </Button>
            <Button className="flex-1 gap-2" onClick={handleConfirm}>
              <Sparkles className="w-4 h-4" />
              Select
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
