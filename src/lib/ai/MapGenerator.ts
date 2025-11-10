import { GoogleGenAI } from "@google/genai";

interface TileMap {
  [key: string]: {
    floor?: string;
    object?: string;
    above_floor?: string;
  };
}

interface Room {
  name: string;
  tilemap: TileMap;
}

interface GeneratedMap {
  rooms: Room[];
}

interface MapGenerationOptions {
  width: number;
  height: number;
  style?: "startup" | "office" | "nature" | "tech";
  roomCount?: number;
}

/**
 * AI-powered map generator using Google Gemini
 * Generates large, startup-style maps with minimal token usage
 */
export class MapGenerator {
  private apiKey: string;
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  /**
   * Generate a new map using AI with token-efficient prompt
   */
  public async generateMap(options: MapGenerationOptions): Promise<GeneratedMap> {
    const { width, height, style = "startup", roomCount = 1 } = options;

    try {
      // Token-efficient prompt focusing on structured output
      const prompt = this.createMapPrompt(width, height, style, roomCount);

      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          temperature: 0.8,
          maxOutputTokens: 2000,
        },
      });

      const result = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      // Extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response");
      }

      const aiMap = JSON.parse(jsonMatch[0]);

      // Convert AI format to our tilemap format
      return this.convertToTilemap(aiMap, width, height, style);
    } catch (error) {
      console.error("AI map generation failed, using fallback:", error);
      return this.generateFallbackMap(width, height, style);
    }
  }

  /**
   * Create token-efficient prompt for map generation
   */
  private createMapPrompt(width: number, height: number, style: string, roomCount: number): string {
    return `Generate a ${width}x${height} startup office layout.

Output ONLY this JSON structure:
{
  "rooms": [
    {"type": "open_office", "count": 2, "size": "large"},
    {"type": "meeting_room", "count": 3, "size": "medium"},
    {"type": "break_area", "count": 1, "size": "small"}
  ],
  "furniture": ["desks", "chairs", "plants", "whiteboards", "coffee_station"],
  "style": "modern_startup"
}

Rules:
- Open office: Clusters of desks (4-6 per cluster)
- Meeting rooms: Table with chairs, whiteboard
- Break area: Plants, seating, coffee
- Hallways: 2-tile wide minimum
- Keep 30% open space for movement`;
  }

  /**
   * Convert AI response to our tilemap format
   */
  private convertToTilemap(aiMap: any, width: number, height: number, style: string): GeneratedMap {
    const tilemap: TileMap = {};

    // Generate base floor
    for (let x = -Math.floor(width / 2); x < Math.ceil(width / 2); x++) {
      for (let y = -Math.floor(height / 2); y < Math.ceil(height / 2); y++) {
        const key = `${x}, ${y}`;
        tilemap[key] = {
          floor: this.getFloorTile(style),
        };
      }
    }

    // Apply AI zones if provided
    if (aiMap.zones) {
      this.applyZones(tilemap, aiMap.zones, width, height, style);
    }

    return {
      rooms: [
        {
          name: "Main",
          tilemap,
        },
      ],
    };
  }

  /**
   * Apply AI-generated zones to tilemap
   */
  private applyZones(
    tilemap: TileMap,
    zones: any[],
    width: number,
    height: number,
    style: string
  ): void {
    for (const zone of zones) {
      if (zone.type === "walls" && zone.pattern === "offices") {
        this.generateOfficeRooms(tilemap, width, height);
      } else if (zone.type === "decorations") {
        this.addDecorations(tilemap, zone.items || [], width, height);
      }
    }
  }

  /**
   * Generate office room layouts
   */
  private generateOfficeRooms(tilemap: TileMap, width: number, height: number): void {
    // Create perimeter walls (map boundaries)
    for (let x = -Math.floor(width / 2); x < Math.ceil(width / 2); x++) {
      const topKey = `${x}, ${-Math.floor(height / 2)}`;
      const bottomKey = `${x}, ${Math.ceil(height / 2) - 1}`;
      if (tilemap[topKey]) tilemap[topKey].object = "grasslands-stone_wall_top";
      if (tilemap[bottomKey]) tilemap[bottomKey].object = "grasslands-stone_wall_bottom";
    }

    for (let y = -Math.floor(height / 2); y < Math.ceil(height / 2); y++) {
      const leftKey = `${-Math.floor(width / 2)}, ${y}`;
      const rightKey = `${Math.ceil(width / 2) - 1}, ${y}`;
      if (tilemap[leftKey]) tilemap[leftKey].object = "grasslands-stone_wall_left";
      if (tilemap[rightKey]) tilemap[rightKey].object = "grasslands-stone_wall_right";
    }

    // Generate meeting rooms in corners
    const roomConfigs = [
      { x: -Math.floor(width / 2) + 2, y: -Math.floor(height / 2) + 2, w: 8, h: 6 },
      { x: Math.ceil(width / 2) - 10, y: -Math.floor(height / 2) + 2, w: 8, h: 6 },
      { x: -Math.floor(width / 2) + 2, y: Math.ceil(height / 2) - 8, w: 8, h: 6 },
      { x: Math.ceil(width / 2) - 10, y: Math.ceil(height / 2) - 8, w: 8, h: 6 },
    ];

    for (const room of roomConfigs) {
      // Room walls
      for (let i = 0; i < room.w; i++) {
        const topKey = `${room.x + i}, ${room.y}`;
        const bottomKey = `${room.x + i}, ${room.y + room.h - 1}`;
        if (tilemap[topKey]) tilemap[topKey].object = "grasslands-stone_wall_top";
        if (tilemap[bottomKey]) tilemap[bottomKey].object = "grasslands-stone_wall_bottom";
      }

      for (let i = 0; i < room.h; i++) {
        const leftKey = `${room.x}, ${room.y + i}`;
        const rightKey = `${room.x + room.w - 1}, ${room.y + i}`;
        if (tilemap[leftKey]) tilemap[leftKey].object = "grasslands-stone_wall_left";
        if (tilemap[rightKey]) tilemap[rightKey].object = "grasslands-stone_wall_right";
      }

      // Door (gap in bottom wall)
      const doorX = room.x + Math.floor(room.w / 2);
      const doorKey = `${doorX}, ${room.y + room.h - 1}`;
      if (tilemap[doorKey]) delete tilemap[doorKey].object;

      // Meeting table (center)
      const centerX = room.x + Math.floor(room.w / 2);
      const centerY = room.y + Math.floor(room.h / 2);
      const tableKey = `${centerX}, ${centerY}`;
      if (tilemap[tableKey]) tilemap[tableKey].object = "grasslands-stone_inverted_2";
    }

    // Add desk clusters in open areas
    const deskClusters = [
      { x: 0, y: -5 },
      { x: -10, y: 5 },
      { x: 10, y: 5 },
      { x: 0, y: 15 },
    ];

    for (const cluster of deskClusters) {
      for (let dx = 0; dx < 3; dx++) {
        for (let dy = 0; dy < 2; dy++) {
          const deskKey = `${cluster.x + dx * 2}, ${cluster.y + dy * 3}`;
          if (tilemap[deskKey] && !tilemap[deskKey].object) {
            tilemap[deskKey].object = "grasslands-stone_inverted_2";
          }
        }
      }
    }
  }

  /**
   * Add decorative elements
   */
  private addDecorations(tilemap: TileMap, items: string[], width: number, height: number): void {
    const decorationMap: Record<string, string> = {
      desks: "grasslands-stone_inverted_2",
      plants: "grasslands-light_basic_tree_bundle",
      whiteboards: "grasslands-blue_flower_5",
      coffee: "grasslands-iight_green_flower_2",
      chairs: "grasslands-stone_inverted_5",
    };

    // Strategic placement instead of random
    const decorationSpots = [
      // Plants in corners and along walls
      ...this.getWallAdjacentSpots(tilemap, width, height, 8, "plants"),
      // Coffee stations near break areas
      ...this.getCenterSpots(tilemap, width, height, 2, "coffee"),
      // Whiteboards near meeting rooms
      ...this.getNearRoomSpots(tilemap, width, height, 4, "whiteboards"),
    ];

    for (const spot of decorationSpots) {
      const key = `${spot.x}, ${spot.y}`;
      if (tilemap[key] && !tilemap[key].object) {
        const decoration = decorationMap[spot.type] || decorationMap.plants;
        tilemap[key].object = decoration;
      }
    }
  }

  private getWallAdjacentSpots(
    tilemap: TileMap,
    width: number,
    height: number,
    count: number,
    type: string
  ): Array<{ x: number; y: number; type: string }> {
    const spots = [];
    const spacing = Math.floor(width / count);

    for (let i = 0; i < count; i++) {
      const x = -Math.floor(width / 2) + 2 + i * spacing;
      const y = -Math.floor(height / 2) + 2;
      spots.push({ x, y, type });
    }

    return spots;
  }

  private getCenterSpots(
    tilemap: TileMap,
    width: number,
    height: number,
    count: number,
    type: string
  ): Array<{ x: number; y: number; type: string }> {
    const spots = [];
    for (let i = 0; i < count; i++) {
      spots.push({
        x: i === 0 ? -5 : 5,
        y: 0,
        type,
      });
    }
    return spots;
  }

  private getNearRoomSpots(
    tilemap: TileMap,
    width: number,
    height: number,
    count: number,
    type: string
  ): Array<{ x: number; y: number; type: string }> {
    const spots = [];
    const roomPositions = [
      { x: -Math.floor(width / 2) + 10, y: -Math.floor(height / 2) + 4 },
      { x: Math.ceil(width / 2) - 12, y: -Math.floor(height / 2) + 4 },
      { x: -Math.floor(width / 2) + 10, y: Math.ceil(height / 2) - 10 },
      { x: Math.ceil(width / 2) - 12, y: Math.ceil(height / 2) - 10 },
    ];

    for (let i = 0; i < Math.min(count, roomPositions.length); i++) {
      spots.push({ ...roomPositions[i], type });
    }

    return spots;
  }

  /**
   * Get appropriate floor tile for style
   */
  private getFloorTile(style: string): string {
    const floorTiles: Record<string, string[]> = {
      startup: ["ground-normal_detailed_grass", "ground-detailed_dirt"],
      office: ["ground-normal_detailed_grass"],
      nature: ["ground-normal_detailed_grass"],
      tech: ["ground-normal_detailed_grass", "ground-detailed_dirt"],
    };

    const tiles = floorTiles[style] || floorTiles.startup;
    return tiles[Math.floor(Math.random() * tiles.length)];
  }

  /**
   * Generate fallback map without AI (procedural)
   */
  private generateFallbackMap(width: number, height: number, style: string): GeneratedMap {
    const tilemap: TileMap = {};

    // Generate base floor
    for (let x = -Math.floor(width / 2); x < Math.ceil(width / 2); x++) {
      for (let y = -Math.floor(height / 2); y < Math.ceil(height / 2); y++) {
        const key = `${x}, ${y}`;
        tilemap[key] = {
          floor: this.getFloorTile(style),
        };
      }
    }

    // Add procedural rooms
    this.generateOfficeRooms(tilemap, width, height);

    // Add decorations
    this.addDecorations(tilemap, ["plants", "desks"], width, height);

    return {
      rooms: [
        {
          name: "Main",
          tilemap,
        },
      ],
    };
  }

  /**
   * Save map to file
   */
  public async saveMap(
    map: GeneratedMap,
    name: string,
    style: string,
    width: number,
    height: number,
    generationMethod: "ai" | "procedural" = "ai"
  ): Promise<string> {
    const id = `map_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Check if running in Tauri
    if (typeof window !== "undefined" && "__TAURI_IPC__" in window) {
      const { invoke } = await import("@tauri-apps/api/core");

      await invoke("save_generated_map", {
        id,
        name,
        width,
        height,
        style,
        roomCount: map.rooms.length,
        tilemapData: JSON.stringify(map),
        generationMethod,
        aiModelUsed: generationMethod === "ai" ? "gemini-2.0-flash-exp" : null,
      });

      return id;
    } else {
      // Browser fallback: use localStorage
      const mapsKey = "swarmville_generated_maps";
      const maps = JSON.parse(localStorage.getItem(mapsKey) || "{}");

      maps[id] = {
        id,
        name,
        width,
        height,
        style,
        roomCount: map.rooms.length,
        tilemapData: map,
        generationMethod,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      localStorage.setItem(mapsKey, JSON.stringify(maps));
      return id;
    }
  }

  /**
   * Generate random map filename
   */
  public generateMapFilename(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `map_${timestamp}_${random}.json`;
  }

  /**
   * List all available maps
   */
  public async listMaps(): Promise<Array<{ id: string; name: string }>> {
    if (typeof window !== "undefined" && "__TAURI_IPC__" in window) {
      const { invoke } = await import("@tauri-apps/api/core");
      try {
        const maps = await invoke<Array<{ id: string; name: string }>>("list_generated_maps");
        return maps;
      } catch {
        return [{ id: "default-map-001", name: "Default Map" }];
      }
    }

    // Browser fallback: localStorage
    const mapsKey = "swarmville_generated_maps";
    const maps = JSON.parse(localStorage.getItem(mapsKey) || "{}");
    return Object.values(maps).map((m: any) => ({ id: m.id, name: m.name }));
  }

  /**
   * Get random map from available maps
   */
  public async getRandomMap(): Promise<string> {
    const maps = await this.listMaps();
    if (maps.length === 0) {
      return "default-map-001";
    }
    const randomIndex = Math.floor(Math.random() * maps.length);
    return maps[randomIndex].id;
  }

  /**
   * Load map from file
   */
  public async loadMap(mapId: string): Promise<GeneratedMap> {
    if (typeof window !== "undefined" && "__TAURI_IPC__" in window) {
      const { invoke } = await import("@tauri-apps/api/core");
      const mapData = await invoke<string>("load_generated_map", { mapId });
      return JSON.parse(mapData);
    }

    // Browser fallback: localStorage
    const mapsKey = "swarmville_generated_maps";
    const maps = JSON.parse(localStorage.getItem(mapsKey) || "{}");

    if (maps[mapId]) {
      return maps[mapId].tilemapData;
    }

    // Fallback to default map file
    const response = await fetch("/maps/defaultmap.json");
    if (!response.ok) {
      throw new Error(`Failed to load map: ${mapId}`);
    }
    return response.json();
  }
}
