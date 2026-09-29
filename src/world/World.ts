import type { Agent, AgentId, AgentState, Job, Peer } from "../types";
import { t } from "../lib/i18n";
import type { Key } from "../lib/i18n";
import { loadAtlas } from "./atlas";
import type { Atlas, Dir, Frame } from "./atlas";
import { buildMap } from "./map";
import type { OfficeMap } from "./map";
import { buildSprites } from "./sprites";
import type { Sprites } from "./sprites";
import {
  MAP,
  TILE,
  artToWorldX,
  artToWorldZ,
  palette,
  peerColor,
  worldToArtX,
  worldToArtY,
  zoneColor,
  zoneTiles
} from "./theme";

/**
 * The office, drawn as a pixel-art map seen from above. It renders one thing:
 * where every agent is and what it is doing. An agent walking to a desk with
 * three bouncing dots over it is mid-model-call; an arc between two agents is a
 * handoff.
 *
 * The world is rasterised at art resolution into an offscreen canvas and then
 * blown up by a whole-number factor, so every pixel on screen is the same size
 * and nothing is ever half-interpolated. Labels are drawn afterwards at full
 * device resolution, where crisp text matters more than pixel purity.
 */

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

const PEER_SHEETS = ["char_player", "char_socrates", "char_neo", "char_vanguard", "char_alexandria", "char_atlas"];

const CONFETTI = ["#8b7cf6", "#4aa3f0", "#f2a03d", "#35c0a0", "#ee7fae", "#ffd166"];

/** Where an agent with no chosen spot can wait in the lobby: tile offsets inside it. */
const LOBBY_SLOTS: [number, number][] = [
  [2, 3.6], [4, 3.6], [6, 3.6], [8, 3.6], [10, 3.6],
  [2, 7.2], [4, 7.2], [6, 7.2], [8, 7.2], [10, 7.2]
];

/** Props that cast no shadow: they hang on a wall rather than stand on the floor. */
const FLAT = new Set(["window"]);

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

interface Waypoint {
  x: number;
  y: number;
  age: number;
  color: string;
}

interface Drawable {
  sort: number;
  tie: number;
  draw: () => void;
}

/** A person or an agent: a four-direction sprite that walks to wherever it is told. */
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
  /** 1 while a freshly dropped agent is in the air, easing to 0 as it lands. */
  fall = 0;

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

  /** How many pixels off the floor the actor is: a drop accelerates into the ground. */
  get lift() {
    return this.fall > 0 ? 36 * (1 - (1 - this.fall) ** 2) : 0;
  }

  update(dt: number) {
    if (this.fall > 0) this.fall = Math.max(0, this.fall - dt / 0.5);
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) {
      this.moving = false;
      this.phase = 0;
      return;
    }
    if (this.glide) {
      // Peers report ~5 times a second. Chasing at a fixed speed makes them
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
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
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
  private readonly map: OfficeMap = buildMap();
  private readonly sprites: Sprites = buildSprites();

  private readonly agents = new Map<AgentId, Actor>();
  private readonly peers = new Map<string, Actor>();
  private readonly workSlot = new Map<AgentId, number>();
  private self: Actor | null = null;
  private selfId: string | null = null;
  private selfSheet = "char_player";
  private selfAccent = "#8b7cf6";
  private selfName: string | null = null;

  /** Agents that people left on the map, one per job in the line. */
  private readonly jobActors = new Map<string, Actor>();
  private dropPreview: { x: number; y: number } | null = null;
  private readonly arcs: Arc[] = [];
  private readonly particles: Particle[] = [];
  private readonly waypoints: Waypoint[] = [];

  private scale = 1;
  private dpr = 1;
  private cam = { x: WORLD_W / 2, y: WORLD_H / 2 };
  private camTarget = { x: WORLD_W / 2, y: WORLD_H / 2 };
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
  private lastSent = { x: -1, y: -1 };
  private selfInCommons = false;
  private disposed = false;

  onSelectAgent: (id: AgentId | null) => void = () => {};
  onSelectJob: (id: string) => void = () => {};
  onSelfMoved: (x: number, z: number) => void = () => {};
  onCommonsChange: (inside: boolean) => void = () => {};

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
    this.bakeTerrain();

    // The floors and furniture are drawn in code; only the characters need the
    // atlas, so a failed fetch costs faces, not the office.
    void loadAtlas().then((atlas) => {
      if (!this.disposed) this.atlas = atlas;
    });

    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerup", this.handlePointerUp);
    canvas.addEventListener("pointercancel", this.handlePointerCancel);
    canvas.addEventListener("contextmenu", this.handleContextMenu);
    canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
    window.addEventListener("resize", this.resize);

    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  // ── the map ────────────────────────────────────────────────────────────────

  /** The floor and walls never change, so they are rasterised once and then blitted. */
  private bakeTerrain() {
    const canvas = document.createElement("canvas");
    canvas.width = WORLD_W;
    canvas.height = WORLD_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < MAP.h; y += 1) {
      for (let x = 0; x < MAP.w; x += 1) {
        const floor = this.map.floor[y][x];
        if (floor === "void") {
          ctx.fillStyle = palette.void;
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        } else {
          ctx.drawImage(this.sprites.tiles[floor], x * TILE, y * TILE);
        }
        const wall = this.map.walls[y][x];
        if (wall) ctx.drawImage(this.sprites.tiles[wall], x * TILE, y * TILE);
      }
    }

    this.markCallZone(ctx);
    for (const decal of this.map.decals) this.blitProp(ctx, decal.name, decal.x, decal.y);
    this.terrain = canvas;
  }

  /** A dashed outline on the floor of the commons: step inside and you are on the call. */
  private markCallZone(ctx: CanvasRenderingContext2D) {
    const rect = zoneTiles.commons;
    const x0 = rect.x * TILE + 5;
    const y0 = rect.y * TILE + 5;
    const x1 = (rect.x + rect.w) * TILE - 6;
    const y1 = (rect.y + rect.h) * TILE - 6;
    ctx.fillStyle = zoneColor.commons;
    ctx.globalAlpha = 0.55;
    for (let x = x0; x <= x1; x += 8) {
      ctx.fillRect(x, y0, 4, 2);
      ctx.fillRect(x, y1, 4, 2);
    }
    for (let y = y0; y <= y1; y += 8) {
      ctx.fillRect(x0, y, 2, 4);
      ctx.fillRect(x1, y, 2, 4);
    }
    ctx.globalAlpha = 1;
  }

  /** Draws a prop with its bottom-centre on (x, y): from our own sprites, else the atlas. */
  private blitProp(ctx: CanvasRenderingContext2D, name: string, x: number, y: number) {
    const own = this.sprites.props[name];
    if (own) {
      if (!FLAT.has(name)) this.drawShadow(ctx, x, y, own.width * 0.8);
      ctx.drawImage(own, Math.round(x - own.width / 2), Math.round(y - own.height));
      return;
    }
    const frame = this.atlas?.data.props[name];
    if (!this.atlas || !frame) return;
    this.drawShadow(ctx, x, y, frame.w * 0.7);
    ctx.drawImage(
      this.atlas.image,
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

  private setZoom(value: number) {
    const next = clamp(Math.round(value), 1, 4);
    if (next === this.scale) return;
    this.scale = next;
    this.resize();
  }

  /** Back to the opening shot: the whole office, nobody followed. */
  resetView() {
    this.engaged = false;
    this.follow = false;
    this.setZoom(1);
    this.camTarget = { x: WORLD_W / 2, y: WORLD_H / 2 };
    this.clampCamera();
  }

  /** The first move is the handover: stop showing the office, start following. */
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
      const worldZ = (rect.y + 5.4 + (slot % 2) * 1.2) / 2 - 8;
      this.workSlot.set(agent.id, slot);

      const existing = this.agents.get(agent.id);
      if (existing) {
        existing.label = agent.name;
        existing.accent = agent.accent;
        existing.sheet = SHEETS[agent.id] ?? "char_player";
        existing.homeX = worldToArtX(worldX);
        existing.homeY = worldToArtY(worldZ);
      } else {
        this.agents.set(
          agent.id,
          new Actor(agent.name, agent.accent, SHEETS[agent.id] ?? "char_player", worldX, worldZ)
        );
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
    // Sit at a desk, offset so two busy agents never share one. The chair is
    // drawn just in front of this spot, so the agent reads as sitting in it.
    const rect = zoneTiles[zone] ?? zoneTiles.build;
    const slot = this.workSlot.get(id) ?? 0;
    actor.moveTo((rect.x + 2.5 + slot * 3) / 2 - 12, (rect.y + 3.4) / 2 - 8);
  }

  handoff(from: AgentId, to: AgentId) {
    if (!this.agents.has(from) || !this.agents.has(to)) return;
    this.arcs.push({ from, to, age: 0 });
  }

  setSelf(peer: Peer) {
    this.selfId = peer.id;
    if (this.self) {
      this.self.moveTo(peer.x, peer.z);
      return;
    }
    this.self = new Actor(this.selfName ?? peer.name, this.selfAccent, this.selfSheet, peer.x, peer.z);
  }

  setSelfStyle(style: { name: string; accent: string }) {
    this.selfAccent = style.accent || this.selfAccent;
    this.selfName = style.name || this.selfName;
    if (!this.self) return;
    this.self.label = style.name || this.self.label;
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
    const actor = new Actor(peer.name, peerColor(peer.id), PEER_SHEETS[hash % PEER_SHEETS.length], peer.x, peer.z);
    actor.glide = true;
    this.peers.set(peer.id, actor);
  }

  movePeer(id: string, x: number, z: number) {
    this.peers.get(id)?.moveTo(x, z);
  }

  removePeer(id: string) {
    this.peers.delete(id);
  }

  /**
   * Where a person's head is on screen, in CSS pixels from the canvas corner.
   * The video bubbles hang from this point, so they follow their owner.
   */
  headOf(id: string): { x: number; y: number } | null {
    const actor = id === this.selfId ? this.self : this.peers.get(id);
    if (!actor) return null;
    const frame = this.charFrame(actor.sheet, actor.dir);
    return {
      x: (actor.x - this.origin.x) * this.scale,
      y: (actor.y - (frame?.h ?? 40) - this.origin.y) * this.scale
    };
  }

  // ── agents people left on the map ──────────────────────────────────────────

  /** The nearest open floor to a point, as the spot a body would stand on; null if none is close. */
  private snap(artX: number, artY: number, radius = 4): { x: number; y: number } | null {
    const tx0 = Math.floor(artX / TILE);
    const ty0 = Math.floor(artY / TILE);
    let best: { tx: number; ty: number } | null = null;
    let bestDistance = Infinity;
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const tx = tx0 + dx;
        const ty = ty0 + dy;
        // Where the relay lets a person stand; anything else would be clamped back.
        if (tx < 2 || ty < 2 || tx > MAP.w - 3 || ty > MAP.h - 4) continue;
        if (this.map.blocked[ty * MAP.w + tx]) continue;
        const distance = dx * dx + dy * dy;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = { tx, ty };
        }
      }
    }
    return best ? { x: (best.tx + 0.5) * TILE, y: (best.ty + 0.85) * TILE } : null;
  }

  private pointerToArt(clientX: number, clientY: number) {
    const bounds = this.canvas?.getBoundingClientRect();
    if (!bounds) return null;
    return {
      x: this.origin.x + (clientX - bounds.left) / this.scale,
      y: this.origin.y + (clientY - bounds.top) / this.scale
    };
  }

  /** Where an agent set down at this screen point would land, or null when there is no floor near it. */
  dropSpot(clientX: number, clientY: number): { x: number; z: number } | null {
    const art = this.pointerToArt(clientX, clientY);
    const spot = art && this.snap(art.x, art.y);
    return spot ? { x: artToWorldX(spot.x), z: artToWorldZ(spot.y) } : null;
  }

  /** Shows a ring where the held agent would land; null hides it. */
  setDropPreview(spot: { x: number; z: number } | null) {
    this.dropPreview = spot ? { x: worldToArtX(spot.x), y: worldToArtY(spot.z) } : null;
  }

  /** One standing agent per job. A new one drops in from above; one that is gone just disappears. */
  setJobs(jobs: Job[]) {
    const live = new Set(jobs.map((job) => job.id));
    for (const id of this.jobActors.keys()) if (!live.has(id)) this.jobActors.delete(id);

    const lobby = zoneTiles.lobby;
    for (const job of jobs) {
      let hash = 0;
      for (let index = 0; index < job.id.length; index += 1) hash = (hash * 31 + job.id.charCodeAt(index)) >>> 0;
      // Without a chosen spot an agent waits in the lobby, on a free one of a
      // grid of places, starting from the one its id points at.
      let wanted = job.at ? { x: worldToArtX(job.at.x), y: worldToArtY(job.at.z) } : null;
      // First keep name tags from overlapping; when the lobby is full, only avoid the exact same place.
      for (const room of [3 * TILE, TILE - 1]) {
        for (let step = 0; step < LOBBY_SLOTS.length && !wanted; step += 1) {
          const [dx, dy] = LOBBY_SLOTS[(hash + step) % LOBBY_SLOTS.length];
          const at = { x: (lobby.x + dx) * TILE, y: (lobby.y + dy) * TILE };
          const taken = [...this.jobActors.values()].some(
            (other) => Math.abs(other.homeX - at.x) <= room && Math.abs(other.homeY - at.y) < TILE
          );
          if (!taken) wanted = at;
        }
      }
      wanted ??= { x: (lobby.x + 6) * TILE, y: (lobby.y + 3.6) * TILE };
      const spot = this.snap(wanted.x, wanted.y) ?? wanted;

      const existing = this.jobActors.get(job.id);
      if (existing) {
        existing.label = job.ownerName;
        existing.busy = job.status === "running";
        continue;
      }
      const actor = new Actor(job.ownerName, peerColor(job.ownerId), PEER_SHEETS[hash % PEER_SHEETS.length], 0, 0);
      actor.x = actor.targetX = actor.homeX = spot.x;
      actor.y = actor.targetY = actor.homeY = spot.y;
      actor.busy = job.status === "running";
      actor.fall = 1;
      this.jobActors.set(job.id, actor);
    }
  }

  /** A small burst of confetti over every agent: the run is done. */
  celebrate() {
    for (const actor of this.agents.values()) {
      for (let n = 0; n < 12; n += 1) {
        const angle = (n / 12) * Math.PI * 2;
        this.particles.push({
          x: actor.x,
          y: actor.y - 30,
          vx: Math.cos(angle) * (30 + (n % 3) * 14),
          vy: -60 - (n % 4) * 14,
          age: 0,
          color: CONFETTI[(n + actor.label.length) % CONFETTI.length]
        });
      }
    }
  }

  focusOnAgent(id: AgentId) {
    const actor = this.agents.get(id);
    if (!actor) return;
    this.follow = false;
    this.camTarget = { x: actor.x, y: actor.y };
    this.clampCamera();
  }

  walkTo(worldX: number, worldZ: number) {
    if (!this.self) return;
    const x = clamp(worldX, BOUNDS.minX, BOUNDS.maxX);
    const z = clamp(worldZ, BOUNDS.minZ, BOUNDS.maxZ);
    this.self.moveTo(x, z);
    this.engage();
    this.addWaypoint(worldToArtX(x), worldToArtY(z), this.selfAccent);
  }

  private addWaypoint(artX: number, artY: number, color: string) {
    this.waypoints.push({ x: artX, y: artY, age: 0, color });
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

  private handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
  };

  private handlePointerDown = (event: PointerEvent) => {
    if (event.button === 2) return;

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
    if (!this.activePointers.has(event.pointerId)) {
      // Hovering: something you can click gets the open hand.
      if (this.canvas) {
        if (this.hit(event.clientX, event.clientY)) this.canvas.dataset.hit = "";
        else delete this.canvas.dataset.hit;
      }
      return;
    }
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
      const dx = (p1.x + p2.x) / 2 - this.dragStart.x;
      const dy = (p1.y + p2.y) / 2 - this.dragStart.y;
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

  private releasePointer(event: PointerEvent) {
    try {
      if (this.canvas?.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may have already been released.
    }
  }

  private handlePointerUp = (event: PointerEvent) => {
    this.activePointers.delete(event.pointerId);
    if (this.activePointers.size === 0) {
      if (!this.dragging) return;
      this.dragging = false;
      this.releasePointer(event);
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
      this.releasePointer(event);
    }
  };

  private handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    this.wheel += event.deltaY;
    if (Math.abs(this.wheel) < 120) return;
    this.setZoom(this.scale + (this.wheel < 0 ? 1 : -1));
    this.wheel = 0;
  };

  /** The agent or left-behind agent under a screen point, if any. */
  private hit(clientX: number, clientY: number): { kind: "agent"; id: AgentId } | { kind: "job"; id: string } | null {
    const art = this.pointerToArt(clientX, clientY);
    if (!art) return null;
    const over = (actor: Actor, slack: number) => {
      const frame = this.charFrame(actor.sheet, actor.dir);
      const w = frame?.w ?? 22;
      const h = frame?.h ?? 40;
      return Math.abs(art.x - actor.x) <= w / 2 + slack && art.y >= actor.y - h - slack && art.y <= actor.y + slack;
    };
    for (const [id, actor] of this.agents) if (over(actor, 8)) return { kind: "agent", id };
    for (const [id, actor] of this.jobActors) if (over(actor, 8)) return { kind: "job", id };
    return null;
  }

  /** A click selects an agent; anywhere else it walks the avatar there. */
  private pick(event: PointerEvent) {
    const hit = this.hit(event.clientX, event.clientY);
    if (hit?.kind === "agent") {
      this.onSelectAgent(hit.id);
      return;
    }
    if (hit?.kind === "job") {
      this.onSelectJob(hit.id);
      return;
    }
    this.onSelectAgent(null);
    const art = this.pointerToArt(event.clientX, event.clientY);
    if (!art || !this.self) return;
    const worldX = clamp(artToWorldX(art.x), BOUNDS.minX, BOUNDS.maxX);
    const worldZ = clamp(artToWorldZ(art.y), BOUNDS.minZ, BOUNDS.maxZ);
    this.self.moveTo(worldX, worldZ);
    this.engage();
    this.addWaypoint(art.x, art.y, this.selfAccent);
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

    // The call is the commons floor itself, edge to edge.
    const room = zoneTiles.commons;
    const tx = this.self.x / TILE;
    const ty = this.self.y / TILE;
    const inside = tx >= room.x && tx < room.x + room.w && ty >= room.y && ty < room.y + room.h;
    if (inside !== this.selfInCommons) {
      this.selfInCommons = inside;
      this.onCommonsChange(inside);
    }

    // Only when it moved: a still avatar chatting at 4.5 msg/s would eat the
    // relay's per-socket budget, and a run start would be dropped with it.
    const moved = Math.abs(this.self.x - this.lastSent.x) + Math.abs(this.self.y - this.lastSent.y) > 0.5;
    if (moved && now - this.lastReport > 220) {
      this.lastReport = now;
      this.lastSent = { x: this.self.x, y: this.self.y };
      this.onSelfMoved(worldX, worldZ);
    }
  }

  // ── drawing ────────────────────────────────────────────────────────────────

  private drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
    ctx.fillStyle = palette.shadow;
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y) - 1, width / 2, Math.max(2, width / 6), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawActor(ctx: CanvasRenderingContext2D, actor: Actor) {
    const frame = this.charFrame(actor.sheet, actor.dir);
    const width = frame?.w ?? 20;
    const height = frame?.h ?? 40;
    const x = Math.round(actor.x);
    const y = Math.round(actor.y) - actor.bob - Math.round(actor.lift);

    this.drawShadow(ctx, actor.x, actor.y, width * 0.8 * (1 - actor.lift / 90));

    if (actor.busy) {
      // A ring on the floor says "this one is mid-model-call" without text.
      ctx.strokeStyle = actor.accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.55 + Math.sin(this.elapsed * 4) * 0.25;
      ctx.beginPath();
      ctx.ellipse(x, Math.round(actor.y) - 1, width * 0.66, width * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (frame && this.atlas) {
      ctx.drawImage(this.atlas.image, frame.x, frame.y, frame.w, frame.h, x - Math.round(width / 2), y - height, width, height);
    } else {
      ctx.fillStyle = actor.accent;
      ctx.fillRect(x - width / 2, y - height, width, height);
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
      ctx.fillStyle = from.accent;
      for (let step = 0; step <= 22; step += 1) {
        const p = step / 22;
        const inv = 1 - p;
        const px = inv * inv * x0 + 2 * inv * p * mx + p * p * x1;
        const py = inv * inv * y0 + 2 * inv * p * my + p * p * y1;
        const head = clamp((arc.age / 1.5) * 1.6 - p, 0, 1);
        ctx.globalAlpha = clamp(life * (1 - head) * 1.4, 0, 1);
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawWorld() {
    const ctx = this.vctx;
    if (!ctx) return;
    const { width, height } = this.view;

    ctx.fillStyle = palette.void;
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

    const list: Drawable[] = [];
    const pad = 64;
    const visible = (x: number, y: number) =>
      x > this.origin.x - pad && x < this.origin.x + width + pad && y > this.origin.y - pad && y < this.origin.y + height + pad;

    for (const prop of this.map.props) {
      if (!visible(prop.x, prop.y)) continue;
      // A desk chair is drawn in front of whoever sits in it, so it overlaps them.
      const sort = prop.name === "chair" ? prop.y - 8 : prop.y;
      list.push({
        sort,
        tie: prop.x,
        draw: () => this.blitProp(ctx, prop.name, prop.x - this.origin.x, prop.y - this.origin.y)
      });
    }

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
    for (const actor of this.jobActors.values()) pushActor(actor);
    if (this.self) pushActor(this.self);

    list.sort((a, b) => a.sort - b.sort || a.tie - b.tie);
    for (const item of list) item.draw();

    this.drawArcs(ctx);

    if (this.dropPreview) {
      // A pulsing ring on the floor where the agent in your hand would land.
      const pulse = 0.5 + Math.sin(this.elapsed * 8) * 0.25;
      const cx = Math.round(this.dropPreview.x - this.origin.x);
      const cy = Math.round(this.dropPreview.y - this.origin.y) - 1;
      ctx.fillStyle = this.selfAccent;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.selfAccent;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = pulse + 0.25;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 15 + pulse * 3, 8 + pulse * 1.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for (const wp of this.waypoints) {
      const progress = wp.age / 0.8;
      ctx.strokeStyle = wp.color;
      ctx.globalAlpha = clamp(1 - progress, 0, 1) * 0.85;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(Math.round(wp.x - this.origin.x), Math.round(wp.y - this.origin.y), Math.round(3 + progress * 12), 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const particle of this.particles) {
      ctx.globalAlpha = clamp(1 - particle.age / 1.4, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.fillRect(Math.round(particle.x - this.origin.x), Math.round(particle.y - this.origin.y), 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  /** A soft white tag with a coloured dot: readable on floor, wall and video alike. */
  private tag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, dot: string, quiet = false) {
    ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    const width = ctx.measureText(text).width + 26;
    ctx.save();
    ctx.shadowColor = "rgba(70, 60, 130, 0.22)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = quiet ? "rgba(255, 255, 255, 0.82)" : "rgba(255, 255, 255, 0.96)";
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y - 10, width, 20, 8);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = dot;
    ctx.beginPath();
    ctx.arc(x - width / 2 + 10, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.ink;
    ctx.textAlign = "left";
    ctx.fillText(text, x - width / 2 + 19, y + 0.5);
    ctx.textAlign = "center";
  }

  /** Three dots that rise and fall in turn: this agent is thinking. */
  private thinking(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.save();
    ctx.shadowColor = "rgba(70, 60, 130, 0.22)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    ctx.beginPath();
    ctx.roundRect(x - 17, y - 9, 34, 18, 9);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = color;
    for (let n = 0; n < 3; n += 1) {
      const lift = Math.max(0, Math.sin(this.elapsed * 6 - n * 0.9)) * 3;
      ctx.beginPath();
      ctx.arc(x - 8 + n * 8, y - lift, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
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

    for (const [id, rect] of Object.entries(zoneTiles)) {
      const walled = id !== "commons" && id !== "lobby";
      const x = toScreenX((rect.x + rect.w / 2) * TILE);
      const y = toScreenY(walled ? (rect.y - 1) * TILE + 21 : rect.y * TILE + 16);
      this.tag(ctx, t(`zone.${id}` as Key), x, y, zoneColor[id] ?? palette.outline, true);
    }

    const head = (actor: Actor) => {
      const frame = this.charFrame(actor.sheet, actor.dir);
      return { x: toScreenX(actor.x), y: toScreenY(actor.y - (frame?.h ?? 40)) - 12 };
    };

    for (const actor of this.agents.values()) {
      const { x, y } = head(actor);
      this.tag(ctx, actor.label, x, y, actor.accent);
      if (actor.busy) this.thinking(ctx, x, y - 24, actor.accent);
    }
    for (const actor of this.peers.values()) {
      const { x, y } = head(actor);
      this.tag(ctx, actor.label, x, y, actor.accent, true);
    }
    for (const actor of this.jobActors.values()) {
      const { x, y } = head(actor);
      this.tag(ctx, t("agent.of", { name: actor.label }), x, y - actor.lift * scale, actor.accent, !actor.busy);
      if (actor.busy) this.thinking(ctx, x, y - 24 - actor.lift * scale, actor.accent);
    }
    if (this.self) {
      const { x, y } = head(this.self);
      this.tag(ctx, this.self.label, x, y, this.self.accent);
    }

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
    for (const actor of this.jobActors.values()) {
      const falling = actor.fall > 0;
      actor.update(dt);
      if (falling && actor.fall === 0) {
        // Touchdown: a ring on the floor and a little dust.
        this.addWaypoint(actor.x, actor.y, actor.accent);
        for (let n = 0; n < 8; n += 1) {
          const angle = (n / 8) * Math.PI * 2;
          this.particles.push({ x: actor.x, y: actor.y - 2, vx: Math.cos(angle) * 34, vy: -22, age: 0.5, color: actor.accent });
        }
      }
    }
    this.updateSelf(dt);
    this.reportSelf(time);

    if (this.follow && this.self) this.camTarget = { x: this.self.x, y: this.self.y };
    this.clampCamera();
    this.cam.x = smooth(this.cam.x, this.camTarget.x, 0.035, dt);
    this.cam.y = smooth(this.cam.y, this.camTarget.y, 0.035, dt);
    this.origin.x = Math.round(this.cam.x - this.view.width / 2);
    this.origin.y = Math.round(this.cam.y - this.view.height / 2);

    for (let index = this.arcs.length - 1; index >= 0; index -= 1) {
      this.arcs[index].age += dt;
      if (this.arcs[index].age >= 1.5) this.arcs.splice(index, 1);
    }
    for (let index = this.waypoints.length - 1; index >= 0; index -= 1) {
      this.waypoints[index].age += dt;
      if (this.waypoints[index].age >= 0.8) this.waypoints.splice(index, 1);
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
    ctx.drawImage(this.view, 0, 0, this.view.width * this.scale * this.dpr, this.view.height * this.scale * this.dpr);
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
    this.canvas?.removeEventListener("contextmenu", this.handleContextMenu);
    this.canvas?.removeEventListener("wheel", this.handleWheel);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);
    window.removeEventListener("resize", this.resize);
    this.agents.clear();
    this.peers.clear();
    this.jobActors.clear();
    this.arcs.length = 0;
    this.particles.length = 0;
    this.waypoints.length = 0;
    this.terrain = null;
    this.atlas = null;
    this.self = null;
  }
}
