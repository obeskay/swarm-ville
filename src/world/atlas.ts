/**
 * The spritesheet produced by tools/pixelize.py from the gpt-image-2 art in
 * art/raw. Everything the town draws comes from this one image, so a single
 * failed fetch is the only failure mode worth handling: the world falls back to
 * flat colour blocks and stays usable.
 */
export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Dir = "down" | "left" | "up" | "right";

export interface AtlasData {
  size: [number, number];
  tile: number;
  tiles: Record<string, Frame>;
  props: Record<string, Frame>;
  chars: Record<string, Record<Dir, Frame>>;
}

export interface Atlas {
  image: HTMLImageElement;
  data: AtlasData;
}

export async function loadAtlas(): Promise<Atlas | null> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}art/atlas.json`);
    if (!response.ok) throw new Error(`atlas.json ${response.status}`);
    const data = (await response.json()) as AtlasData;
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("atlas.png failed to load"));
      element.src = `${import.meta.env.BASE_URL}art/atlas.png`;
    });
    return { image, data };
  } catch (error) {
    console.warn("[world] running without art:", error);
    return null;
  }
}
