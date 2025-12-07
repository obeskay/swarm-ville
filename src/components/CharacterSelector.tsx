import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "sonner";

const CHARACTERS = Array.from({ length: 27 }, (_, i) => ({
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
  const imgRef = useRef<HTMLImageElement | null>(null);

  const selectedChar = CHARACTERS.find((c) => c.id === selectedId)!;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return;

    // Stop previous animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    frameRef.current = 0;

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;

      // Character sprite: 192x192 with 4x4 grid (48x48 each frame)
      // Format: 4 frames horizontal, 4 rows for different directions
      const FRAMES = 4;
      const FRAME_WIDTH = 48;
      const FRAME_HEIGHT = 48; // Each frame is 48x48, not 48x192
      const PREVIEW_SCALE = 3;

      const animateFrame = () => {
        // Fill background with sky blue
        ctx.fillStyle = "rgb(135, 206, 235)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Get current frame (0-3)
        const frameIndex = Math.floor((frameRef.current / 12) % FRAMES);

        // Calculate display size
        const displayWidth = FRAME_WIDTH * PREVIEW_SCALE;
        const displayHeight = FRAME_HEIGHT * PREVIEW_SCALE;
        const x = (canvas.width - displayWidth) / 2;
        const y = (canvas.height - displayHeight) / 2;

        // Disable smoothing for pixel-perfect rendering
        ctx.imageSmoothingEnabled = false;

        // Draw SINGLE frame from spritesheet (first row, idle_down)
        ctx.drawImage(
          img,
          frameIndex * FRAME_WIDTH, // source x (0, 48, 96, 144)
          0, // source y (first row for idle_down)
          FRAME_WIDTH, // source width (48)
          FRAME_HEIGHT, // source height (48)
          x, // dest x
          y, // dest y
          displayWidth, // dest width
          displayHeight // dest height
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
    toast.success(`✓ ${selectedChar.name} seleccionado`, {
      duration: 2000,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <Card className="w-80 max-h-[90vh] overflow-hidden p-4 bg-card border border-border shadow-2xl">
        <div className="space-y-3">
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground font-mono">SELECCIONAR PERSONAJE</h2>
            <p className="text-xs text-muted-foreground font-mono">{selectedChar.name}</p>
          </div>

          {/* Preview Canvas */}
          <div className="flex justify-center bg-muted rounded border border-border p-2">
            <canvas
              ref={canvasRef}
              width={144}
              height={144}
              className="bg-transparent"
              style={{ imageRendering: "pixelated", width: "144px", height: "144px" }}
            />
          </div>

          {/* Character Grid */}
          <div className="grid grid-cols-5 gap-1 max-h-28 overflow-y-auto bg-muted p-2 rounded border border-border">
            {CHARACTERS.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedId(char.id)}
                className={`p-1.5 rounded text-center text-xs font-mono ${
                  selectedId === char.id
                    ? "bg-primary text-primary-foreground font-bold"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {char.id}
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="flex-1 font-mono text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              size="sm"
              className="flex-1 bg-primary text-primary-foreground font-mono text-xs"
            >
              Usar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
