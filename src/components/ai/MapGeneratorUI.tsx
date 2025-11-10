import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MapGenerator } from "../../lib/ai/MapGenerator";
import { toast } from "sonner";
import { Loader2, Map, Sparkles } from "lucide-react";

interface MapGeneratorUIProps {
  onMapGenerated?: (filename: string) => void;
}

export default function MapGeneratorUI({ onMapGenerated }: MapGeneratorUIProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerateMap = async () => {
    try {
      setGenerating(true);
      const mapGenerator = new MapGenerator();

      // Generate large startup-style map
      const generatedMap = await mapGenerator.generateMap({
        width: 80,
        height: 80,
        style: "startup",
        roomCount: 1,
      });

      // Auto-save
      const mapFilename = mapGenerator.generateMapFilename();
      const mapId = await mapGenerator.saveMap(
        generatedMap,
        mapFilename,
        "startup",
        80,
        80,
        "ai"
      );

      toast.success(`Map generated: ${mapFilename}`);
      onMapGenerated?.(mapFilename);
    } catch (error) {
      console.error("Map generation failed:", error);
      toast.error("Failed to generate map");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5" />
          AI Map Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGenerateMap}
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate New Map
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
