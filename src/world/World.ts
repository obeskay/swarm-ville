import type { Agent, AgentId, AgentState, AvatarProfile, Peer, Project } from "../types";
import { loadAtlas } from "./atlas";
import type { Atlas, Dir, Frame } from "./atlas";
import { buildMap } from "./map";
import type { VillageMap } from "./map";
import {
  MAP,
  TILE,
  artToWorldX,
  artToWorldZ,
  palette,
  plotTiles,
  worldToArtX,
  worldToArtY,
  zoneColor,
  zoneLayout,
  zoneTiles
} from "./theme";

/**
 * The town, drawn as a pixel-art map seen from above. It renders one thing:
 * where every agent is and what it is doing. An agent walking to a desk with a
 * lit ring is mid-model-call; an arc between two agents is a handoff.
 *
 * The world is rasterised at art resolution into an offscreen canvas and then
 * blown up by a whole-number factor, so every pixel on screen is the same size
 * and nothing is ever half-interpolated. Labels are drawn afterwards at full
 * device resolution, where crisp text matters more than pixel purity.
 */

const COMMONS = zoneLayout.commons;
const WORLD_W = MAP.w * TILE;
const WORLD_H = MAP.h * TILE;

/** The relay clamps peers to these world units; the avatar respects the same box. */
const BOUNDS = { minX: -11, maxX: 11, minZ: -7, maxZ: 7 };

const SHEETS: Record<AgentId, string> = {
  planner: "char_atlas",
  builder: "char_neo",
  reviewer: "char_socrates",
  verifier: "char_vanguard",
  archivist: "char_alexandria"
};

const PEER_SHEETS = [
  "char_player",
  "char_socrates",
  "char_neo",
  "char_vanguard",
  "char_alexandria",
  "char_atlas"
];

const CROP_STAGES = ["crop_0", "crop_1", "crop_2", "crop_3"];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Walking zoom. A phone at 3x would only see six tiles across, so it stays at 1. */
const walkScale = () => (window.innerWidth < 720 ? 1 : 2);

/** Framerate-independent smoothing: the gap halves every `halfLife` seconds. */
const smooth = (current: number, target: number, halfLife: number, dt: number) =>
  current + (target - current) * (1 - Math.pow(2, -dt / halfLife));

interface Arc {
  from: AgentId;
  to: AgentId;
  age: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  color: string;
}

interface Drawable {
  sort: number;
  tie: number;
  draw: () => void;
}

/** A villager: a four-direction sprite that walks to wherever it is told. */
class Actor {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  homeX: number;
  homeY: number;
  dir: Dir = "down";
  moving = false;
  busy = false;
  phase = 0;
  speed = 136;
  glide = false;

  constructor(
    public label: string,
    public accent: string,
    public sheet: string,
    worldX: number,
    worldZ: number
  ) {
    this.x = worldToArtX(worldX);
    this.y = worldToArtY(worldZ);
    this.targetX = this.x;
    this.targetY = this.y;
    this.homeX = this.x;
    this.homeY = this.y;
  }

  moveTo(worldX: number, worldZ: number) {
    this.targetX = worldToArtX(worldX);
    this.targetY = worldToArtY(worldZ);
  }

  goHome() {
    this.targetX = this.homeX;
    this.targetY = this.homeY;
  }

  update(dt: number) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) {
      this.moving = false;
      this.phase = 0;
      return;
    }
    if (this.glide) {
      // Peers report ~10 times a second. Chasing at a fixed speed makes them
      // arrive between samples and stutter; easing toward the last one does not.
      this.x = smooth(this.x, this.targetX, 0.08, dt);
      this.y = smooth(this.y, this.targetY, 0.08, dt);
    } else {
      const step = Math.min(distance, this.speed * dt);
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
    }
    this.phase += dt * 8;
    this.moving = true;
    this.dir =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  }

  /** A one-pixel hop reads as a walk cycle at this scale, with four still frames. */
  get bob() {
    return this.moving && Math.sin(this.phase) > 0 ? 1 : 0;
  }
}

export class World {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private view = document.createElement("canvas");
  private vctx = this.view.getContext("2d");
  private terrain: HTMLCanvasElement | null = null;
  private atlas: Atlas | null = null;
  private map: VillageMap = buildMap();

  private readonly agents = new Map<AgentId, Actor>();
  private readonly peers = new Map<string, Actor>();
  private readonly workSlot = new Map<AgentId, number>();
  private self: Actor | null = null;
  private selfSheet = "char_player";
  private selfAccent = "#e0a86b";

  private projects: Project[] = [];
  private selectedProjectId: string | null = null;
  private readonly arcs: Arc[] = [];
  private readonly particles: Particle[] = [];

  private scale = 1;
  private dpr = 1;
  private cam = { x: WORLD_W / 2 + 64, y: WORLD_H / 2 };
  private camTarget = { x: WORLD_W / 2 + 64, y: WORLD_H / 2 };
  private follow = false;
  private engaged = false;
  private origin = { x: 0, y: 0 };

  private readonly keys = new Set<string>();
  private readonly activePointers = new Map<number, { x: number; y: number }>();
  private wheel = 0;
  private dragging = false;
  private dragged = false;
  private dragStart = { x: 0, y: 0 };
  private camStart = { x: 0, y: 0 };
  private pinchDistStart = 0;
  private pinchScaleStart = 1;

  private frame = 0;
  private lastTime = 0;
  private elapsed = 0;
  private lastReport = 0;
  private selfInCommons = false;
  private disposed = false;

  onSelectAgent: (id: AgentId | null) => void = () => {};
  onSelectProject: (id: string | null) => void = () => {};
  onSelectMarket: () => void = () => {};
  onSelfMoved: (x: number, z: number) => void = () => {};
  onCommonsChange: (inside: boolean) => void = () => {};

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();

    void loadAtlas().then((atlas) => {
      if (this.disposed) return;
      this.atlas = atlas;
      this.bakeTerrain();
    });

    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerup", this.handlePointerUp);
    canvas.addEventListener("pointercancel", this.handlePointerCancel);
    canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
    window.addEventListener("resize", this.resize);

    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  // ── the map ────────────────────────────────────────────────────────────────

  /** The ground never changes, so it is rasterised once and then blitted. */
  private bakeTerrain() {
    const atlas = this.atlas;
    const canvas = document.createElement("canvas");
    canvas.width = WORLD_W;
    canvas.height = WORLD_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const fallback: Record<string, string> = {
      grass: palette.grass,
      grass2: "#88b071",
      path: palette.path,
      stone: palette.stone,
      wood: palette.timber,
      water: palette.water,
      soil: "#5a4633"
    };

    for (let y = 0; y < MAP.h; y += 1) {
      for (let x = 0; x < MAP.w; x += 1) {
        const name = this.map.ground[y][x];
        const frame = atlas?.data.tiles[name];
        if (!frame || !atlas) {
          ctx.fillStyle = fallback[name] ?? palette.grass;
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
          continue;
        }
        // Mirroring every third tile breaks up the repeat without a second texture.
        const flip = (x * 7 + y * 13) % 3 === 0;
        ctx.save();
        ctx.translate(x * TILE + (flip ? TILE : 0), y * TILE);
        if (flip) ctx.scale(-1, 1);
        ctx.drawImage(atlas.image, frame.x, frame.y, frame.w, frame.h, 0, 0, TILE, TILE);
        ctx.restore();
      }
    }

    for (const decal of this.map.decals) this.blitProp(ctx, decal.name, decal.x, decal.y);

    this.terrain = canvas;
  }

  private blitProp(ctx: CanvasRenderingContext2D, name: string, x: number, y: number) {
    const atlas = this.atlas;
    const frame = atlas?.data.props[name];
    if (!atlas || !frame) return;
    ctx.drawImage(
      atlas.image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      Math.round(x - frame.w / 2),
      Math.round(y - frame.h),
      frame.w,
      frame.h
    );
  }

  private charFrame(sheet: string, dir: Dir): Frame | null {
    return this.atlas?.data.chars[sheet]?.[dir] ?? null;
  }

  // ── camera ─────────────────────────────────────────────────────────────────

  private resize = () => {
    if (!this.canvas) return;
    this.dpr = clamp(Math.round(window.devicePixelRatio || 1), 1, 2);
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.view.width = Math.ceil(width / this.scale);
    this.view.height = Math.ceil(height / this.scale);
    this.vctx = this.view.getContext("2d");
    if (this.vctx) this.vctx.imageSmoothingEnabled = false;
  };

  private clampCamera() {
    const halfW = this.view.width / 2;
    const halfH = this.view.height / 2;
    this.camTarget.x =
      WORLD_W <= this.view.width ? WORLD_W / 2 : clamp(this.camTarget.x, halfW, WORLD_W - halfW);
    this.camTarget.y =
      WORLD_H <= this.view.height ? WORLD_H / 2 : clamp(this.camTarget.y, halfH, WORLD_H - halfH);
  }

  setZoom(value: number) {
    const next = clamp(Math.round(value), 1, 5);
    if (next === this.scale) return;
    this.scale = next;
    this.resize();
  }

  zoomIn() {
    this.setZoom(this.scale + 1);
  }

  zoomOut() {
    this.setZoom(this.scale - 1);
  }

  /** Back to the opening shot: the whole village, nobody followed. */
  resetView() {
    this.engaged = false;
    this.follow = false;
    this.setZoom(1);
    this.camTarget = { x: WORLD_W / 2 + 64, y: WORLD_H / 2 };
    this.clampCamera();
  }

  /** The first move is the handover: stop showing the town, start following. */
  private engage() {
    if (this.engaged) return;
    this.engaged = true;
    this.follow = true;
    this.setZoom(walkScale());
  }

  // ── agents and peers ───────────────────────────────────────────────────────

  setAgents(agents: Agent[]) {
    const validIds = new Set(agents.map((a) => a.id));
    for (const id of this.agents.keys()) {
      if (!validIds.has(id)) this.agents.delete(id);
    }

    const perZone = new Map<string, Agent[]>();
    for (const agent of agents) {
      const list = perZone.get(agent.zone) ?? [];
      list.push(agent);
      perZone.set(agent.zone, list);
    }

    for (const agent of agents) {
      const rect = zoneTiles[agent.zone] ?? zoneTiles.build;
      const siblings = perZone.get(agent.zone) ?? [agent];
      const slot = siblings.indexOf(agent);
      // Idle agents stand along the front of their room, spread so two name
      // tags never sit on one line.
      const spread = (slot + 1) / (siblings.length + 1);
      const worldX = (rect.x + spread * rect.w) / 2 - 12;
      const worldZ = (rect.y + 5 + (slot % 2) * 1.2) / 2 - 8;
      this.workSlot.set(agent.id, slot);

      const existing = this.agents.get(agent.id);
      if (existing) {
        existing.label = agent.name;
        existing.accent = agent.accent;
        existing.sheet = SHEETS[agent.id] ?? "char_player";
        existing.homeX = worldToArtX(worldX);
        existing.homeY = worldToArtY(worldZ);
      } else {
        const actor = new Actor(agent.name, agent.accent, SHEETS[agent.id] ?? "char_player", worldX, worldZ);
        this.agents.set(agent.id, actor);
      }
    }
  }

  setAgentState(id: AgentId, state: AgentState, zone: string) {
    const actor = this.agents.get(id);
    if (!actor) return;
    actor.busy = state === "working";
    if (state !== "working") {
      actor.goHome();
      return;
    }
    // Stand at a desk, offset so two busy agents never share one.
    const rect = zoneTiles[zone] ?? zoneTiles.build;
    const slot = this.workSlot.get(id) ?? 0;
    actor.moveTo((rect.x + 2.5 + slot * 3) / 2 - 12, (rect.y + 3.4) / 2 - 8);
  }

  handoff(from: AgentId, to: AgentId) {
    if (!this.agents.has(from) || !this.agents.has(to)) return;
    this.arcs.push({ from, to, age: 0 });
  }

  setSelf(peer: Peer) {
    if (this.self) {
      this.self.moveTo(peer.x, peer.z);
      this.self.label = peer.name;
      return;
    }
    this.self = new Actor(peer.name, this.selfAccent, this.selfSheet, peer.x, peer.z);
    if (!this.follow) return;
    this.camTarget = { x: this.self.x, y: this.self.y };
    this.cam = { ...this.camTarget };
  }

  setSelfStyle(avatar: AvatarProfile) {
    this.selfAccent = avatar.accent || this.selfAccent;
    if (!this.self) return;
    this.self.label = avatar.name || this.self.label;
    this.self.accent = this.selfAccent;
  }

  upsertPeer(peer: Peer) {
    const existing = this.peers.get(peer.id);
    if (existing) {
      existing.moveTo(peer.x, peer.z);
      existing.label = peer.name;
      return;
    }
    let hash = 0;
    for (let index = 0; index < peer.id.length; index += 1) hash = (hash * 31 + peer.id.charCodeAt(index)) >>> 0;
    const actor = new Actor(peer.name, "#b9c4d4", PEER_SHEETS[hash % PEER_SHEETS.length], peer.x, peer.z);
    actor.glide = true;
    this.peers.set(peer.id, actor);
  }

  updatePeer(peer: Peer) {
    this.upsertPeer(peer);
  }

  movePeer(id: string, x: number, z: number) {
    this.peers.get(id)?.moveTo(x, z);
  }

  removePeer(id: string) {
    this.peers.delete(id);
  }

  // ── product plots ──────────────────────────────────────────────────────────

  setProjects(projects: Project[]) {
    this.projects = projects.slice(0, plotTiles.length);
  }

  setSelectedProject(id: string | null) {
    this.selectedProjectId = id;
  }

  private plotRect(index: number) {
    const rect = plotTiles[index % plotTiles.length];
    return {
      x: rect.x * TILE,
      y: rect.y * TILE,
      w: rect.w * TILE,
      h: rect.h * TILE
    };
  }

  celebrateProject(id: string) {
    const index = this.projects.findIndex((project) => project.id === id);
    if (index < 0) return;
    const rect = this.plotRect(index);
    const color = this.projects[index].color || "#ffd47f";
    for (let n = 0; n < 14; n += 1) {
      const angle = (n / 14) * Math.PI * 2;
      this.particles.push({
        x: rect.x + rect.w / 2,
        y: rect.y + rect.h / 2,
        vx: Math.cos(angle) * (40 + (n % 3) * 14),
        vy: -70 - (n % 4) * 16,
        age: 0,
        color: n % 3 === 0 ? "#ffd47f" : color
      });
    }
  }

  focusOnProject(id: string) {
    const index = this.projects.findIndex((project) => project.id === id);
    if (index < 0) return;
    const rect = this.plotRect(index);
    this.follow = false;
    this.camTarget = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
    this.clampCamera();
  }

  // ── input ──────────────────────────────────────────────────────────────────

  private handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
    if (!/^(Arrow|Key[WASD])/.test(event.code)) return;
    this.keys.add(event.code);
    this.engage();
    event.preventDefault();
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private handleBlur = () => {
    this.keys.clear();
  };

  private handlePointerDown = (event: PointerEvent) => {
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.activePointers.size === 1) {
      this.dragging = true;
      this.dragged = false;
      this.dragStart = { x: event.clientX, y: event.clientY };
      this.camStart = { ...this.camTarget };
      this.canvas?.setPointerCapture(event.pointerId);
    } else if (this.activePointers.size === 2) {
      this.dragged = true;
      const [p1, p2] = Array.from(this.activePointers.values());
      this.pinchDistStart = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      this.pinchScaleStart = this.scale;
      this.dragStart = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      this.camStart = { ...this.camTarget };
    }
  };

  private handlePointerMove = (event: PointerEvent) => {
    if (!this.activePointers.has(event.pointerId)) return;
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.activePointers.size === 2) {
      const [p1, p2] = Array.from(this.activePointers.values());
      const currentDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const ratio = currentDist / Math.max(20, this.pinchDistStart);
      if (ratio > 1.35) {
        this.setZoom(this.pinchScaleStart + 1);
        this.pinchDistStart = currentDist;
        this.pinchScaleStart = this.scale;
      } else if (ratio < 0.72) {
        this.setZoom(this.pinchScaleStart - 1);
        this.pinchDistStart = currentDist;
        this.pinchScaleStart = this.scale;
      }
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dx = midX - this.dragStart.x;
      const dy = midY - this.dragStart.y;
      this.follow = false;
      this.camTarget = { x: this.camStart.x - dx / this.scale, y: this.camStart.y - dy / this.scale };
      this.clampCamera();
      return;
    }

    if (!this.dragging) return;
    const dx = event.clientX - this.dragStart.x;
    const dy = event.clientY - this.dragStart.y;
    if (Math.abs(dx) + Math.abs(dy) > 8) this.dragged = true;
    if (!this.dragged) return;
    this.follow = false;
    this.camTarget = { x: this.camStart.x - dx / this.scale, y: this.camStart.y - dy / this.scale };
    this.clampCamera();
  };

  private handlePointerUp = (event: PointerEvent) => {
    this.activePointers.delete(event.pointerId);
    if (this.activePointers.size === 0) {
      if (!this.dragging) return;
      this.dragging = false;
      try {
        if (this.canvas?.hasPointerCapture(event.pointerId)) {
          this.canvas.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Pointer capture may have already been released
      }
      if (!this.dragged) this.pick(event);
    } else if (this.activePointers.size === 1) {
      const remaining = Array.from(this.activePointers.values())[0];
      this.dragStart = { x: remaining.x, y: remaining.y };
      this.camStart = { ...this.camTarget };
    }
  };

  private handlePointerCancel = (event: PointerEvent) => {
    this.activePointers.delete(event.pointerId);
    if (this.activePointers.size === 0) {
      this.dragging = false;
      this.dragged = false;
      try {
        if (this.canvas?.hasPointerCapture(event.pointerId)) {
          this.canvas.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Pointer capture may have already been released
      }
    }
  };

  private handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    // Zoom levels are whole numbers, so a single tick must not jump one. Wait
    // for a deliberate amount of scrolling before stepping.
    this.wheel += event.deltaY;
    if (Math.abs(this.wheel) < 120) return;
    this.setZoom(this.scale + (this.wheel < 0 ? 1 : -1));
    this.wheel = 0;
  };

  /** A click selects an agent or a plot; otherwise it walks the avatar there. */
  private pick(event: PointerEvent) {
    if (!this.canvas) return;
    const bounds = this.canvas.getBoundingClientRect();
    const artX = this.origin.x + (event.clientX - bounds.left) / this.scale;
    const artY = this.origin.y + (event.clientY - bounds.top) / this.scale;

    for (const [id, actor] of this.agents) {
      const frame = this.charFrame(actor.sheet, actor.dir);
      const w = frame?.w ?? 22;
      const h = frame?.h ?? 40;
      // Generous hitboxes for easy touch tapping on mobile & iPad
      if (Math.abs(artX - actor.x) <= w / 2 + 8 && artY >= actor.y - h - 8 && artY <= actor.y + 8) {
        this.onSelectAgent(id);
        return;
      }
    }

    for (let index = 0; index < this.projects.length; index += 1) {
      const rect = this.plotRect(index);
      if (artX >= rect.x - 4 && artX <= rect.x + rect.w + 4 && artY >= rect.y - 20 && artY <= rect.y + rect.h + 8) {
        this.onSelectProject(this.projects[index].id);
        return;
      }
    }

    const market = zoneTiles.market;
    if (
      artX >= market.x * TILE - 4 &&
      artX <= (market.x + market.w) * TILE + 4 &&
      artY >= market.y * TILE - 4 &&
      artY <= (market.y + market.h) * TILE + 4
    ) {
      this.onSelectMarket();
      return;
    }

    if (this.self) {
      const worldX = clamp(artToWorldX(artX), BOUNDS.minX, BOUNDS.maxX);
      const worldZ = clamp(artToWorldZ(artY), BOUNDS.minZ, BOUNDS.maxZ);
      this.self.moveTo(worldX, worldZ);
      this.engage();
      return;
    }

    this.onSelectAgent(null);
    this.onSelectProject(null);
  }

  private walkable(x: number, y: number) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (tx < 0 || ty < 0 || tx >= MAP.w || ty >= MAP.h) return false;
    return this.map.blocked[ty * MAP.w + tx] === 0;
  }

  /** Walk the avatar, sliding along whatever it bumps into rather than sticking. */
  private moveSelf(actor: Actor, dx: number, dy: number) {
    if (dx !== 0 && this.walkable(actor.x + dx, actor.y)) actor.x += dx;
    if (dy !== 0 && this.walkable(actor.x, actor.y + dy)) actor.y += dy;
    actor.x = clamp(actor.x, worldToArtX(BOUNDS.minX), worldToArtX(BOUNDS.maxX));
    actor.y = clamp(actor.y, worldToArtY(BOUNDS.minZ), worldToArtY(BOUNDS.maxZ));
  }

  private updateSelf(dt: number) {
    const actor = this.self;
    if (!actor) return;

    let kx = 0;
    let ky = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) kx -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) kx += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) ky -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) ky += 1;

    if (kx !== 0 || ky !== 0) {
      const length = Math.hypot(kx, ky);
      const step = actor.speed * dt;
      this.moveSelf(actor, (kx / length) * step, (ky / length) * step);
      actor.targetX = actor.x;
      actor.targetY = actor.y;
      actor.moving = true;
      actor.phase += dt * 8;
      actor.dir = Math.abs(kx) > Math.abs(ky) ? (kx > 0 ? "right" : "left") : ky > 0 ? "down" : "up";
      return;
    }

    const dx = actor.targetX - actor.x;
    const dy = actor.targetY - actor.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1.5) {
      actor.moving = false;
      actor.phase = 0;
      return;
    }
    const step = Math.min(distance, actor.speed * dt);
    const beforeX = actor.x;
    const beforeY = actor.y;
    this.moveSelf(actor, (dx / distance) * step, (dy / distance) * step);
    // Wedged against a corner: drop the target instead of grinding into it.
    if (Math.abs(actor.x - beforeX) + Math.abs(actor.y - beforeY) < 0.05) {
      actor.targetX = actor.x;
      actor.targetY = actor.y;
      actor.moving = false;
      return;
    }
    actor.moving = true;
    actor.phase += dt * 8;
    actor.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  }

  private reportSelf(now: number) {
    if (!this.self) return;
    const worldX = artToWorldX(this.self.x);
    const worldZ = artToWorldZ(this.self.y);

    const inside = Math.hypot(worldX - COMMONS.x, worldZ - COMMONS.z) < COMMONS.w / 2;
    if (inside !== this.selfInCommons) {
      this.selfInCommons = inside;
      this.onCommonsChange(inside);
    }

    if (now - this.lastReport > 220) {
      this.lastReport = now;
      this.onSelfMoved(worldX, worldZ);
    }
  }

  // ── drawing ────────────────────────────────────────────────────────────────

  private drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
    ctx.fillStyle = palette.shadow;
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y) - 1, width / 2, Math.max(2, width / 5), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawActor(ctx: CanvasRenderingContext2D, actor: Actor) {
    const frame = this.charFrame(actor.sheet, actor.dir);
    const width = frame?.w ?? 20;
    const height = frame?.h ?? 40;
    const x = Math.round(actor.x);
    const y = Math.round(actor.y) - actor.bob;

    this.drawShadow(ctx, actor.x, actor.y, width * 0.8);

    if (actor.busy) {
      // A ring on the ground says "this one is mid-model-call" without text.
      ctx.strokeStyle = actor.accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.55 + Math.sin(this.elapsed * 4) * 0.2;
      ctx.beginPath();
      ctx.ellipse(x, Math.round(actor.y) - 1, width * 0.62, width * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (frame && this.atlas) {
      ctx.drawImage(
        this.atlas.image,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        x - Math.round(width / 2),
        y - height,
        width,
        height
      );
    } else {
      ctx.fillStyle = actor.accent;
      ctx.fillRect(x - width / 2, y - height, width, height);
    }

    if (actor.busy) {
      for (let n = 0; n < 3; n += 1) {
        const lift = Math.sin(this.elapsed * 5 - n * 0.7);
        ctx.globalAlpha = 0.35 + Math.max(0, lift) * 0.6;
        ctx.fillStyle = actor.accent;
        ctx.fillRect(x - 5 + n * 4, y - height - 8 - Math.round(Math.max(0, lift) * 2), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawWater(ctx: CanvasRenderingContext2D) {
    const frame = this.atlas?.data.tiles.water;
    if (!frame || !this.atlas) return;
    const offset = Math.floor((this.elapsed * 5) % TILE);
    const x0 = Math.max(0, Math.floor(this.origin.x / TILE));
    const y0 = Math.max(0, Math.floor(this.origin.y / TILE));
    const x1 = Math.min(MAP.w - 1, Math.ceil((this.origin.x + this.view.width) / TILE));
    const y1 = Math.min(MAP.h - 1, Math.ceil((this.origin.y + this.view.height) / TILE));

    for (let ty = y0; ty <= y1; ty += 1) {
      for (let tx = x0; tx <= x1; tx += 1) {
        if (this.map.ground[ty][tx] !== "water") continue;
        const dx = tx * TILE - this.origin.x;
        const dy = ty * TILE - this.origin.y;
        const top = TILE - offset;
        ctx.drawImage(this.atlas.image, frame.x, frame.y + offset, frame.w, top, dx, dy, TILE, top);
        if (offset > 0) {
          ctx.drawImage(this.atlas.image, frame.x, frame.y, frame.w, offset, dx, dy + top, TILE, offset);
        }
      }
    }
  }

  private drawArcs(ctx: CanvasRenderingContext2D) {
    for (const arc of this.arcs) {
      const from = this.agents.get(arc.from);
      const to = this.agents.get(arc.to);
      if (!from || !to) continue;
      const life = 1 - arc.age / 1.5;
      const x0 = from.x - this.origin.x;
      const y0 = from.y - 26 - this.origin.y;
      const x1 = to.x - this.origin.x;
      const y1 = to.y - 26 - this.origin.y;
      const lift = Math.hypot(x1 - x0, y1 - y0) * 0.28;
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2 - lift;

      // Dots rather than a stroked line: a hard 2px square keeps the pixel grid.
      ctx.fillStyle = "#ffd9a0";
      for (let step = 0; step <= 22; step += 1) {
        const t = step / 22;
        const inv = 1 - t;
        const px = inv * inv * x0 + 2 * inv * t * mx + t * t * x1;
        const py = inv * inv * y0 + 2 * inv * t * my + t * t * y1;
        const head = clamp((arc.age / 1.5) * 1.6 - t, 0, 1);
        ctx.globalAlpha = clamp(life * (1 - head) * 1.4, 0, 1);
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawPlots(list: Drawable[], ctx: CanvasRenderingContext2D) {
    for (let index = 0; index < this.projects.length; index += 1) {
      const project = this.projects[index];
      const rect = this.plotRect(index);
      const selected = project.id === this.selectedProjectId;

      list.push({
        sort: rect.y,
        tie: rect.x,
        draw: () => {
          if (selected) {
            ctx.strokeStyle = project.color || "#ffd47f";
            ctx.globalAlpha = 0.55 + Math.sin(this.elapsed * 4) * 0.2;
            ctx.lineWidth = 1;
            ctx.strokeRect(
              rect.x - this.origin.x + 0.5,
              rect.y - this.origin.y + 0.5,
              rect.w - 1,
              rect.h - 1
            );
            ctx.globalAlpha = 1;
          }
          const stage = clamp(Math.floor((project.progress / 100) * 4), 0, 3);
          const name = project.readyToHarvest ? "crop_3" : CROP_STAGES[stage];
          for (let crop = 0; crop < 3; crop += 1) {
            const cx = rect.x + rect.w * (0.2 + crop * 0.3) - this.origin.x;
            const cy = rect.y + rect.h - 3 - this.origin.y;
            this.blitProp(ctx, name, cx, cy);
          }
          if (project.readyToHarvest) {
            const lift = Math.round(Math.sin(this.elapsed * 3) * 2);
            ctx.fillStyle = "#ffd47f";
            ctx.fillRect(rect.x + rect.w / 2 - 2 - this.origin.x, rect.y - 12 + lift - this.origin.y, 4, 4);
          }
        }
      });
    }
  }

  /** Everything that stands on the ground, painted back to front. */
  private drawWorld() {
    const ctx = this.vctx;
    if (!ctx) return;
    const { width, height } = this.view;

    ctx.fillStyle = palette.night;
    ctx.fillRect(0, 0, width, height);

    if (this.terrain) {
      let sx = this.origin.x;
      let sy = this.origin.y;
      let dx = 0;
      let dy = 0;
      if (sx < 0) {
        dx = -sx;
        sx = 0;
      }
      if (sy < 0) {
        dy = -sy;
        sy = 0;
      }
      const sw = Math.min(width - dx, WORLD_W - sx);
      const sh = Math.min(height - dy, WORLD_H - sy);
      if (sw > 0 && sh > 0) ctx.drawImage(this.terrain, sx, sy, sw, sh, dx, dy, sw, sh);
    }

    this.drawWater(ctx);

    const list: Drawable[] = [];
    const pad = 64;
    const visible = (x: number, y: number) =>
      x > this.origin.x - pad &&
      x < this.origin.x + width + pad &&
      y > this.origin.y - pad &&
      y < this.origin.y + height + pad;

    for (const prop of this.map.props) {
      if (!visible(prop.x, prop.y)) continue;
      list.push({
        sort: prop.y,
        tie: prop.x,
        draw: () => this.blitProp(ctx, prop.name, prop.x - this.origin.x, prop.y - this.origin.y)
      });
    }

    this.drawPlots(list, ctx);

    const pushActor = (actor: Actor) => {
      if (!visible(actor.x, actor.y)) return;
      list.push({
        sort: actor.y + 0.5,
        tie: actor.x,
        draw: () => {
          ctx.save();
          ctx.translate(-this.origin.x, -this.origin.y);
          this.drawActor(ctx, actor);
          ctx.restore();
        }
      });
    };
    for (const actor of this.agents.values()) pushActor(actor);
    for (const actor of this.peers.values()) pushActor(actor);
    if (this.self) pushActor(this.self);

    list.sort((a, b) => a.sort - b.sort || a.tie - b.tie);
    for (const item of list) item.draw();

    this.drawArcs(ctx);

    for (const particle of this.particles) {
      ctx.globalAlpha = clamp(1 - particle.age / 1.4, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.fillRect(Math.round(particle.x - this.origin.x), Math.round(particle.y - this.origin.y), 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Labels live at device resolution, not art resolution: a name that has to be
   * read every second is worth more legible than pixel-pure.
   */
  private drawLabels() {
    const ctx = this.ctx;
    if (!ctx || !this.canvas) return;
    const scale = this.scale;
    const toScreenX = (artX: number) => (artX - this.origin.x) * scale;
    const toScreenY = (artY: number) => (artY - this.origin.y) * scale;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "600 10px ui-sans-serif, system-ui, sans-serif";
    for (const [id, rect] of Object.entries(zoneTiles)) {
      const x = toScreenX((rect.x + rect.w / 2) * TILE);
      const y = toScreenY((rect.y + 0.6) * TILE);
      const text = id.toUpperCase().split("").join(" ");
      const width = ctx.measureText(text).width + 18;
      ctx.fillStyle = "rgba(22, 20, 15, 0.62)";
      ctx.beginPath();
      ctx.roundRect(x - width / 2, y - 9, width, 18, 9);
      ctx.fill();
      ctx.fillStyle = zoneColor[id] ?? palette.ink;
      ctx.fillText(text, x, y + 1);
    }

    for (let index = 0; index < this.projects.length; index += 1) {
      const project = this.projects[index];
      const rect = this.plotRect(index);
      const x = toScreenX(rect.x + rect.w / 2);
      const y = toScreenY(rect.y) - 10;
      const text = `${project.name} · ${Math.round(project.progress)}%`;
      ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
      const width = ctx.measureText(text).width + 14;
      ctx.fillStyle = "rgba(22, 20, 15, 0.78)";
      ctx.beginPath();
      ctx.roundRect(x - width / 2, y - 9, width, 18, 9);
      ctx.fill();
      ctx.fillStyle = project.color || palette.ink;
      ctx.fillText(text, x, y + 1);
    }

    const tag = (actor: Actor, muted: boolean) => {
      const frame = this.charFrame(actor.sheet, actor.dir);
      const x = toScreenX(actor.x);
      const y = toScreenY(actor.y - (frame?.h ?? 40)) - 10;
      ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
      const width = ctx.measureText(actor.label).width + 14;
      ctx.fillStyle = muted ? "rgba(22, 20, 15, 0.55)" : "rgba(22, 20, 15, 0.78)";
      ctx.beginPath();
      ctx.roundRect(x - width / 2, y - 9, width, 18, 9);
      ctx.fill();
      ctx.fillStyle = muted ? "rgba(244, 236, 224, 0.75)" : actor.accent;
      ctx.fillText(actor.label, x, y + 1);
    };

    for (const actor of this.agents.values()) tag(actor, false);
    for (const actor of this.peers.values()) tag(actor, true);
    if (this.self) tag(this.self, false);

    ctx.restore();
  }

  private tick = (time: number) => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
    const dt = clamp((time - this.lastTime) / 1000, 0.001, 0.05);
    this.lastTime = time;
    this.elapsed = time / 1000;

    for (const actor of this.agents.values()) actor.update(dt);
    for (const actor of this.peers.values()) actor.update(dt);
    this.updateSelf(dt);
    this.reportSelf(time);

    if (this.follow && this.self) this.camTarget = { x: this.self.x, y: this.self.y };
    this.clampCamera();
    this.cam.x = smooth(this.cam.x, this.camTarget.x, 0.035, dt);
    this.cam.y = smooth(this.cam.y, this.camTarget.y, 0.035, dt);
    // Whole art pixels only, or the tiles crawl against each other as it pans.
    this.origin.x = Math.round(this.cam.x - this.view.width / 2);
    this.origin.y = Math.round(this.cam.y - this.view.height / 2);

    for (let index = this.arcs.length - 1; index >= 0; index -= 1) {
      this.arcs[index].age += dt;
      if (this.arcs[index].age >= 1.5) this.arcs.splice(index, 1);
    }
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.age += dt;
      particle.vy += dt * 160;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (particle.age >= 1.4) this.particles.splice(index, 1);
    }

    this.drawWorld();

    const ctx = this.ctx;
    if (!ctx || !this.canvas) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(
      this.view,
      0,
      0,
      this.view.width * this.scale * this.dpr,
      this.view.height * this.scale * this.dpr
    );
    this.drawLabels();
  };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.canvas?.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas?.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas?.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas?.removeEventListener("pointercancel", this.handlePointerCancel);
    this.canvas?.removeEventListener("wheel", this.handleWheel);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);
    window.removeEventListener("resize", this.resize);
    this.agents.clear();
    this.peers.clear();
    this.arcs.length = 0;
    this.particles.length = 0;
    this.terrain = null;
    this.atlas = null;
    this.self = null;
  }
}
