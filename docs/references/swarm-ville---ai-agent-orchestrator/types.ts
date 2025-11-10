export interface Agent {
  id: string;
  name: string;
  role: string;
  visualPrompt: string;
  avatar: string; // base64 image data URL
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  isMoving: boolean;
  isAnimated: boolean;
  frameCount: number;
  frameWidth?: number;
}

export interface Artifact {
  id: string;
  type: 'code' | 'text';
  content: string;
  ownerRole: string;
  x: number;
  y: number;
}
