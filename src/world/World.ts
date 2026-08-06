import * as THREE from "three";
import type { Agent, AgentId, AgentState, AvatarProfile, Peer, Project } from "../types";
import { hex, palette, zoneColor, zoneLayout } from "./theme";

/**
 * The town. It renders one thing: where every agent is and what it is doing.
 * An agent standing in its plot is idle; an agent at the workbench with a lit
 * ring is mid-step. Handoffs are drawn as arcs between the two agents involved,
 * so the shape of the loop is visible without reading any text.
 */

const WORLD = { width: 24, depth: 16 };
const COMMONS = zoneLayout.commons;

const box = (w: number, h: number, d: number, color: number, x: number, y: number, z: number) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const facePiece = (w: number, h: number, d: number, color: number, x: number, y: number, z: number) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ color, transparent: true })
  );
  mesh.position.set(x, y, z);
  return mesh;
};

/** A flat text plate laid on the ground, used for zone names. */
const groundLabel = (text: string, color: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = hex(color);
  ctx.globalAlpha = 0.9;
  ctx.font = "600 56px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "8px";
  ctx.fillText(text.toUpperCase(), 256, 68);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.8),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0.6 })
  );
  plane.rotation.x = -Math.PI / 2;
  return plane;
};

/** A small name tag that always faces the camera. */
const nameTag = (text: string, color: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 80;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Sprite();

  ctx.fillStyle = "rgba(24, 22, 20, 0.78)";
  ctx.beginPath();
  ctx.roundRect(4, 18, 312, 44, 22);
  ctx.fill();
  ctx.fillStyle = hex(color);
  ctx.font = "600 26px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 160, 41);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  );
  sprite.scale.set(1.5, 0.375, 1);
  sprite.renderOrder = 10;
  return sprite;
};

/** A blocky character: chunky silhouette, expressive face and a readable work ring. */
class Character {
  readonly group = new THREE.Group();
  readonly home = new THREE.Vector3();
  readonly target = new THREE.Vector3();
  readonly ring: THREE.Mesh;

  private readonly body = new THREE.Group();
  private readonly leftLeg = new THREE.Group();
  private readonly rightLeg = new THREE.Group();
  private readonly leftArm = new THREE.Group();
  private readonly rightArm = new THREE.Group();
  private readonly seed = Math.random() * Math.PI * 2;
  private label: THREE.Sprite;
  private busy = false;

  constructor(label: string, accent: number, skin: number, position: THREE.Vector3, style = "guest") {
    this.home.copy(position);
    this.target.copy(position);
    this.group.position.copy(position);
    this.group.add(this.body);

    const shoes = 0x4a4038;
    const hair = 0x3d3229;
    const shirtLight = 0xf7e3c2;

    this.leftLeg.position.set(-0.11, 0.02, 0);
    this.leftLeg.add(box(0.17, 0.34, 0.19, shoes, 0, 0.17, 0));
    this.leftLeg.add(box(0.2, 0.12, 0.28, shoes, 0, 0.04, 0.06));
    this.rightLeg.position.set(0.11, 0.02, 0);
    this.rightLeg.add(box(0.17, 0.34, 0.19, shoes, 0, 0.17, 0));
    this.rightLeg.add(box(0.2, 0.12, 0.28, shoes, 0, 0.04, 0.06));
    this.body.add(this.leftLeg, this.rightLeg);

    this.body.add(box(0.54, 0.56, 0.42, accent, 0, 0.64, 0));
    this.body.add(box(0.58, 0.07, 0.43, 0x5b4c42, 0, 0.43, 0));
    this.body.add(box(0.26, 0.08, 0.43, shirtLight, 0, 0.91, 0));

    this.leftArm.position.set(-0.36, 0.82, 0);
    this.leftArm.add(box(0.15, 0.28, 0.18, accent, 0, -0.12, 0));
    this.leftArm.add(box(0.17, 0.15, 0.2, skin, 0, -0.34, 0));
    this.rightArm.position.set(0.36, 0.82, 0);
    this.rightArm.add(box(0.15, 0.28, 0.18, accent, 0, -0.12, 0));
    this.rightArm.add(box(0.17, 0.15, 0.2, skin, 0, -0.34, 0));
    this.body.add(this.leftArm, this.rightArm);

    this.body.add(box(0.48, 0.44, 0.4, skin, 0, 1.2, 0));
    this.body.add(box(0.1, 0.14, 0.12, skin, -0.28, 1.2, 0));
    this.body.add(box(0.1, 0.14, 0.12, skin, 0.28, 1.2, 0));
    this.body.add(box(0.5, 0.11, 0.42, hair, 0, 1.46, -0.015));
    this.body.add(box(0.42, 0.1, 0.38, accent, 0, 1.52, 0));
    this.body.add(box(0.56, 0.06, 0.24, accent, 0, 1.45, 0.14));

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.32, 16),
      new THREE.MeshBasicMaterial({ color: 0x2b241e, transparent: true, opacity: 0.22, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    this.group.add(shadow);

    const eye = new THREE.MeshBasicMaterial({ color: 0x2a241e });
    const glint = new THREE.MeshBasicMaterial({ color: 0xfff8eb });
    for (const offset of [-0.11, 0.11]) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.025), eye);
      mesh.position.set(offset, 1.22, 0.215);
      this.body.add(mesh);
      const sparkle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.012), glint);
      sparkle.position.set(offset - 0.016, 1.245, 0.235);
      this.body.add(sparkle);
    }
    this.body.add(facePiece(0.07, 0.035, 0.018, 0xf1a7a2, -0.17, 1.13, 0.218));
    this.body.add(facePiece(0.07, 0.035, 0.018, 0xf1a7a2, 0.17, 1.13, 0.218));
    this.body.add(facePiece(0.08, 0.025, 0.018, 0x8c4c59, 0, 1.105, 0.22));

    this.addAccessory(style, shirtLight);

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.38, 0.5, 28),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.02;
    this.group.add(this.ring);

    this.label = nameTag(label, accent);
    this.label.position.set(0, 1.78, 0);
    this.group.add(this.label);
  }

  private addAccessory(style: string, shirtLight: number) {
    switch (style) {
      case "planner": {
        this.body.add(box(0.16, 0.23, 0.045, 0xf4dfb5, -0.3, 0.68, 0.235));
        this.body.add(box(0.16, 0.035, 0.05, 0xe58c62, -0.3, 0.78, 0.24));
        break;
      }
      case "builder": {
        this.body.add(box(0.56, 0.08, 0.45, 0xe1ad63, 0, 0.5, 0));
        this.body.add(box(0.06, 0.2, 0.05, 0x8b633d, 0.28, 0.72, 0.22));
        this.body.add(box(0.13, 0.08, 0.05, 0x6f9ba0, 0.28, 0.61, 0.22));
        break;
      }
      case "reviewer": {
        this.body.add(box(0.13, 0.035, 0.026, 0x4c5361, -0.11, 1.24, 0.24));
        this.body.add(box(0.13, 0.035, 0.026, 0x4c5361, 0.11, 1.24, 0.24));
        this.body.add(box(0.08, 0.025, 0.026, 0x4c5361, 0, 1.24, 0.24));
        break;
      }
      case "verifier": {
        this.body.add(box(0.4, 0.06, 0.08, 0x6ab7ae, 0, 1.42, 0.24));
        this.body.add(box(0.12, 0.035, 0.03, shirtLight, 0, 1.43, 0.285));
        break;
      }
      case "archivist": {
        this.body.add(box(0.2, 0.22, 0.06, 0x9d6fba, 0.3, 0.68, 0.23));
        this.body.add(box(0.025, 0.22, 0.065, 0xf3d18b, 0.3, 0.68, 0.265));
        break;
      }
      case "self": {
        this.body.add(box(0.22, 0.11, 0.045, 0xf4c86b, 0, 0.91, 0.235));
        this.body.add(box(0.05, 0.16, 0.04, 0xf4c86b, 0.11, 0.8, 0.23));
        break;
      }
      default:
        break;
    }
  }

  setBusy(busy: boolean) {
    this.busy = busy;
  }

  moveTo(x: number, z: number) {
    this.target.set(x, 0, z);
  }

  setLabel(label: string, accent: number) {
    const next = nameTag(label, accent);
    next.position.copy(this.label.position);
    next.scale.copy(this.label.scale);
    this.group.remove(this.label);
    this.label.material.map?.dispose();
    this.label.material.dispose();
    this.label.geometry.dispose();
    this.label = next;
    this.group.add(this.label);
  }

  update(delta: number, elapsed: number) {
    const distance = this.group.position.distanceTo(this.target);
    const walking = distance > 0.04;
    const stride = walking ? Math.sin(elapsed * 10.5 + this.seed) : Math.sin(elapsed * 1.8 + this.seed) * 0.08;
    this.leftLeg.rotation.x = stride * 0.42;
    this.rightLeg.rotation.x = -stride * 0.42;
    this.leftArm.rotation.x = -stride * 0.26;
    this.rightArm.rotation.x = stride * 0.26;
    if (distance > 0.04) {
      const direction = this.target.clone().sub(this.group.position).normalize();
      this.group.position.addScaledVector(direction, Math.min(distance, delta * 2.2));
      this.group.rotation.y = Math.atan2(direction.x, direction.z);
      this.body.position.y = Math.abs(Math.sin(elapsed * 10.5 + this.seed)) * 0.055;
    } else {
      this.body.position.y = Math.sin(elapsed * 1.8 + this.seed) * 0.012;
    }

    const material = this.ring.material as THREE.MeshBasicMaterial;
    const wanted = this.busy ? 0.35 + Math.sin(elapsed * 3.4 + this.seed) * 0.22 : 0;
    material.opacity += (wanted - material.opacity) * Math.min(1, delta * 6);
    this.ring.rotation.z += delta * (this.busy ? 0.9 : 0.15);
  }

  dispose(parent: THREE.Object3D) {
    parent.remove(this.group);
    this.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Sprite)) return;
      object.geometry.dispose();
      const material = object.material;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else {
        if (object instanceof THREE.Sprite) material.map?.dispose();
        material.dispose();
      }
    });
  }
}

interface Arc {
  line: THREE.Line;
  age: number;
}

interface Critter {
  group: THREE.Group;
  origin: THREE.Vector3;
  phase: number;
  speed: number;
}

interface Celebration {
  mesh: THREE.Mesh;
  age: number;
  velocity: THREE.Vector3;
  spin: number;
}

export class World {
  private readonly scene = new THREE.Scene();
  private readonly root = new THREE.Group();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly agents = new Map<AgentId, Character>();
  private readonly workSlot = new Map<AgentId, number>();
  private readonly peers = new Map<string, Character>();
  private readonly projectPlots = new Map<string, THREE.Group>();
  private readonly arcs: Arc[] = [];
  private readonly critters: Critter[] = [];
  private readonly celebrations: Celebration[] = [];
  private market: THREE.Group | null = null;
  private selectedProjectId: string | null = null;

  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ground: THREE.Mesh | null = null;
  private frame = 0;
  private lastTime = 0;
  private disposed = false;

  private zoom = 1;
  private readonly focus = new THREE.Vector3();
  private dragging = false;
  private dragged = false;
  private dragStart = { x: 0, y: 0 };
  private focusStart = { x: 0, z: 0 };

  private self: Character | null = null;
  private selfInCommons = false;
  private lastReport = 0;

  onSelectAgent: (id: AgentId | null) => void = () => {};
  onSelectProject: (id: string | null) => void = () => {};
  onSelectMarket: () => void = () => {};
  onSelfMoved: (x: number, z: number) => void = () => {};
  onCommonsChange: (inside: boolean) => void = () => {};

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene.background = new THREE.Color(palette.sky);
    this.scene.fog = new THREE.Fog(palette.sky, 22, 42);
    this.scene.add(this.root);

    this.addLights();
    this.buildTown();
    this.setupCamera();
    this.resize();

    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerup", this.handlePointerUp);
    canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    window.addEventListener("resize", this.resize);

    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private addLights() {
    this.scene.add(new THREE.HemisphereLight(0xf2e2c6, 0x3a3830, 1.6));

    const sun = new THREE.DirectionalLight(0xffe6bc, 2.6);
    sun.position.set(-10, 16, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    // A warm lamp over the commons so the meeting spot reads as the centre.
    const lamp = new THREE.PointLight(0xffc079, 14, 12, 2);
    lamp.position.set(COMMONS.x, 3.4, COMMONS.z);
    this.scene.add(lamp);
  }

  private buildTown() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD.width, WORLD.depth),
      new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    this.root.add(ground);
    this.ground = ground;

    for (const [id, area] of Object.entries(zoneLayout)) this.buildPlot(id, area);
    this.buildCommons();
    this.buildPaths();
    this.buildWater();
    this.buildMarket();
    this.buildSkyDecor();
    this.buildFences();
    this.buildCritters();

    for (const [x, z, scale] of [
      [-11, -5.6, 1],
      [11.2, -5.2, 0.85],
      [-11.4, 5.6, 0.8],
      [11.4, 5.8, 1.05],
      [-2.6, -6.4, 0.7],
      [4.6, 6.4, 0.75]
    ] as const) {
      this.addTree(x, z, scale);
    }
  }

  private buildPaths() {
    for (const [w, d, x, z] of [
      [18.5, 0.78, 0, -0.52],
      [0.78, 9.4, 3.96, 2.15],
      [15.5, 0.7, 0, 6.1]
    ] as const) {
      const path = box(w, 0.035, d, palette.path, x, 0.018, z);
      path.castShadow = false;
      path.receiveShadow = true;
      this.root.add(path);
    }

    for (const [x, z] of [[-3.6, -0.52], [3.55, -0.52], [3.96, -2.2], [3.96, 5.05]] as const) {
      this.addLamp(x, z);
    }
  }

  private addLamp(x: number, z: number) {
    const lamp = new THREE.Group();
    lamp.position.set(x, 0, z);
    lamp.add(box(0.09, 1.65, 0.09, palette.timber, 0, 0.82, 0));
    const cap = box(0.38, 0.25, 0.38, 0xffc079, 0, 1.7, 0);
    const material = cap.material as THREE.MeshStandardMaterial;
    material.emissive = new THREE.Color(0xffa34f);
    material.emissiveIntensity = 0.7;
    lamp.add(cap);
    this.root.add(lamp);
  }

  private buildWater() {
    const pond = new THREE.Mesh(
      new THREE.CircleGeometry(1.65, 28),
      new THREE.MeshStandardMaterial({ color: palette.water, roughness: 0.22, metalness: 0.08 })
    );
    pond.name = "pond-water";
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(8.4, 0.018, -5.65);
    pond.receiveShadow = true;
    this.root.add(pond);

    for (const [x, z, scale] of [[7.1, -5.3, 0.7], [9.7, -5.8, 0.85], [8.75, -7.0, 0.55]] as const) {
      const rock = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.34 * scale, 0),
        new THREE.MeshStandardMaterial({ color: palette.stone, roughness: 1, flatShading: true })
      );
      rock.position.set(x, 0.18 * scale, z);
      rock.castShadow = true;
      this.root.add(rock);
    }

    for (const [x, z] of [[7.2, -6.75], [9.8, -6.75], [6.85, -4.75]] as const) {
      for (const offset of [-0.12, 0, 0.12]) this.root.add(box(0.035, 0.42, 0.035, palette.leaf, x + offset, 0.21, z));
    }
  }

  private buildMarket() {
    const market = new THREE.Group();
    market.name = "market-stall";
    market.position.set(-10.15, 0, 0.05);
    market.add(box(1.9, 0.12, 1.05, palette.timber, 0, 0.72, 0));
    for (const [x, z] of [[-0.72, -0.35], [0.72, -0.35], [-0.72, 0.35], [0.72, 0.35]] as const) {
      market.add(box(0.08, 0.72, 0.08, palette.timber, x, 0.36, z));
    }
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.35, 0.62, 4),
      new THREE.MeshStandardMaterial({ color: palette.roof, roughness: 0.9 })
    );
    roof.position.y = 1.52;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    market.add(roof);
    market.add(box(0.85, 0.22, 0.08, zoneColor.commons, 0, 1.08, 0.58));
    for (const [x, color] of [[-0.55, zoneColor.plan], [-0.18, zoneColor.build], [0.18, zoneColor.review], [0.55, zoneColor.memory]] as const) {
      const crate = box(0.22, 0.22, 0.22, color, x, 0.9, 0);
      crate.castShadow = true;
      market.add(crate);
    }
    const label = groundLabel("market", zoneColor.commons);
    if (label) {
      label.position.set(-10.15, 0.02, 1.02);
      this.root.add(label);
    }
    this.root.add(market);
    this.market = market;
  }

  private buildSkyDecor() {
    this.addWindmill(10.1, 6.55, 0.88);
    this.addCloud(-7.6, -5.6, 0.9);
    this.addCloud(3.2, 7.1, 0.72);
    this.addFlowerPatch(-9.6, 4.35, 0xf0b36f);
    this.addFlowerPatch(10.1, -3.8, 0xe7a4a0);
  }

  private buildFences() {
    this.addFence(-9.55, -0.15, 2.6, 0);
    this.addFence(8.4, -4.2, 2.6, Math.PI / 2);
    this.addFence(-2.1, 5.75, 2.2, 0);
  }

  private addFence(x: number, z: number, length: number, rotation = 0) {
    const fence = new THREE.Group();
    fence.position.set(x, 0, z);
    fence.rotation.y = rotation;
    const half = length / 2;
    for (const px of [-half, 0, half]) fence.add(box(0.11, 0.72, 0.11, palette.timber, px, 0.36, 0));
    fence.add(box(length, 0.11, 0.09, palette.plaster, 0, 0.54, 0));
    fence.add(box(length, 0.09, 0.09, palette.plaster, 0, 0.28, 0));
    this.root.add(fence);
  }

  private buildCritters() {
    this.addChicken(8.2, -4.15, 0.72);
    this.addChicken(9.8, -5.0, 0.56);
    this.addChicken(-9.15, 0.25, 0.62);
  }

  private addChicken(x: number, z: number, scale: number) {
    const chicken = new THREE.Group();
    chicken.position.set(x, 0, z);
    chicken.scale.setScalar(scale);
    chicken.add(box(0.46, 0.38, 0.34, 0xf4e5d1, 0, 0.45, 0));
    chicken.add(box(0.14, 0.34, 0.14, 0xd69b76, -0.14, 0.17, 0));
    chicken.add(box(0.14, 0.34, 0.14, 0xd69b76, 0.14, 0.17, 0));
    const head = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.24, 0),
      new THREE.MeshStandardMaterial({ color: 0xf4e5d1, roughness: 1, flatShading: true })
    );
    head.position.set(0.2, 0.78, 0);
    head.castShadow = true;
    chicken.add(head);
    chicken.add(box(0.16, 0.1, 0.1, 0xe0a86b, 0.43, 0.75, 0));
    chicken.add(box(0.08, 0.13, 0.08, 0xd98878, 0.2, 1.03, 0));
    const eye = new THREE.MeshBasicMaterial({ color: 0x2a241e });
    const eyeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), eye);
    eyeMesh.position.set(0.38, 0.82, 0.16);
    chicken.add(eyeMesh);
    chicken.name = `critter-${this.critters.length}`;
    this.root.add(chicken);
    this.critters.push({ group: chicken, origin: new THREE.Vector3(x, 0, z), phase: Math.random() * Math.PI * 2, speed: 0.7 + Math.random() * 0.35 });
  }

  private addCloud(x: number, z: number, scale: number) {
    const cloud = new THREE.Group();
    cloud.position.set(x, 5.8 + scale * 0.45, z);
    cloud.scale.setScalar(scale);
    for (const [px, py, pz, size] of [
      [-0.75, 0, 0, 0.62],
      [0, 0.16, 0.02, 0.82],
      [0.78, 0.02, 0.03, 0.58]
    ] as const) {
      const puff = new THREE.Mesh(
        new THREE.IcosahedronGeometry(size, 1),
        new THREE.MeshStandardMaterial({ color: 0xf4e5d1, roughness: 1, flatShading: true, transparent: true, opacity: 0.86 })
      );
      puff.position.set(px, py, pz);
      puff.castShadow = false;
      puff.receiveShadow = false;
      cloud.add(puff);
    }
    this.root.add(cloud);
  }

  private addWindmill(x: number, z: number, scale: number) {
    const windmill = new THREE.Group();
    windmill.position.set(x, 0, z);
    windmill.scale.setScalar(scale);
    windmill.add(box(0.72, 2.4, 0.72, palette.plaster, 0, 1.2, 0));
    windmill.add(box(0.88, 0.14, 0.86, palette.timber, 0, 2.42, 0));

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.67, 0.45, 4),
      new THREE.MeshStandardMaterial({ color: palette.roof, roughness: 0.9 })
    );
    roof.position.y = 2.72;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    windmill.add(roof);

    const blades = new THREE.Group();
    blades.name = "windmill-blades";
    blades.position.set(0, 2.05, 0.42);
    for (const angle of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
      const blade = box(0.12, 0.86, 0.08, palette.timber, 0, 0.43, 0);
      blade.position.set(Math.sin(angle) * 0.43, Math.cos(angle) * 0.43, 0);
      blade.rotation.z = -angle;
      blades.add(blade);
    }
    windmill.add(blades);
    this.root.add(windmill);
  }

  private addFlowerPatch(x: number, z: number, color: number) {
    const patch = new THREE.Group();
    patch.position.set(x, 0, z);
    for (const [px, pz] of [[-0.28, -0.12], [0.08, 0.12], [0.34, -0.02], [0, -0.28]] as const) {
      patch.add(box(0.035, 0.3, 0.035, palette.leaf, px, 0.15, pz));
      const flower = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.12, 0),
        new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true })
      );
      flower.position.set(px, 0.34, pz);
      flower.castShadow = true;
      patch.add(flower);
    }
    this.root.add(patch);
  }

  private buildPlot(id: string, area: { x: number; z: number; w: number; d: number }) {
    if (id === "commons") return;
    const color = zoneColor[id] ?? palette.stone;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(area.w, area.d),
      new THREE.MeshStandardMaterial({
        color: palette.path,
        roughness: 1,
        transparent: true,
        opacity: 0.55
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(area.x, 0.005, area.z);
    floor.receiveShadow = true;
    this.root.add(floor);

    // A thin coloured kerb is the only place a zone's colour touches the
    // ground — enough to identify the plot, not enough to shout.
    for (const [w, d, x, z] of [
      [area.w, 0.1, area.x, area.z - area.d / 2],
      [area.w, 0.1, area.x, area.z + area.d / 2],
      [0.1, area.d, area.x - area.w / 2, area.z],
      [0.1, area.d, area.x + area.w / 2, area.z]
    ] as const) {
      const edge = box(w, 0.09, d, color, x, 0.04, z);
      edge.castShadow = false;
      this.root.add(edge);
    }

    const label = groundLabel(id, color);
    if (label) {
      label.position.set(area.x, 0.02, area.z + area.d / 2 - 0.55);
      this.root.add(label);
    }

    this.addHouse(area.x - area.w / 2 + 1.5, area.z - 0.9, color);
    this.addBench(area.x + area.w / 2 - 1.4, area.z + 1.5);
  }

  private addHouse(x: number, z: number, accent: number) {
    const house = new THREE.Group();
    house.position.set(x, 0, z);
    house.add(box(1.9, 1.15, 1.5, palette.plaster, 0, 0.58, 0));
    house.add(box(0.16, 1.15, 0.16, palette.timber, -0.87, 0.58, 0.67));
    house.add(box(0.16, 1.15, 0.16, palette.timber, 0.87, 0.58, 0.67));

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.45, 0.62, 4),
      new THREE.MeshStandardMaterial({ color: palette.roof, roughness: 0.9 })
    );
    roof.position.y = 1.45;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    house.add(box(0.42, 0.72, 0.05, palette.timber, 0, 0.36, 0.76));

    const glow = box(0.34, 0.3, 0.05, accent, 0.6, 0.78, 0.76);
    const glowMaterial = glow.material as THREE.MeshStandardMaterial;
    glowMaterial.emissive = new THREE.Color(accent);
    glowMaterial.emissiveIntensity = 0.35;
    house.add(glow);

    this.root.add(house);
  }

  /** The workbench each agent walks to while a step is running. */
  private addBench(x: number, z: number) {
    const bench = new THREE.Group();
    bench.position.set(x, 0, z);
    bench.add(box(1.3, 0.09, 0.7, palette.timber, 0, 0.62, 0));
    for (const [dx, dz] of [
      [-0.55, -0.25],
      [0.55, -0.25],
      [-0.55, 0.25],
      [0.55, 0.25]
    ] as const) {
      bench.add(box(0.09, 0.6, 0.09, palette.timber, dx, 0.31, dz));
    }
    this.root.add(bench);
  }

  private buildCommons() {
    const area = COMMONS;

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(area.w / 2, 40),
      new THREE.MeshStandardMaterial({ color: palette.path, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(area.x, 0.006, area.z);
    floor.receiveShadow = true;
    this.root.add(floor);

    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.15, 0.14, 32),
      new THREE.MeshStandardMaterial({ color: palette.timber, roughness: 0.7 })
    );
    table.position.set(area.x, 0.72, area.z);
    table.castShadow = true;
    this.root.add(table);
    this.root.add(box(0.3, 0.72, 0.3, palette.timber, area.x, 0.36, area.z));

    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      this.root.add(
        box(
          0.42,
          0.44,
          0.42,
          palette.stone,
          area.x + Math.cos(angle) * 1.85,
          0.22,
          area.z + Math.sin(angle) * 1.85
        )
      );
    }

    this.root.add(box(0.14, 2.9, 0.14, palette.timber, area.x, 1.45, area.z - 2.5));
    const lantern = box(0.34, 0.34, 0.34, 0xffc079, area.x, 2.95, area.z - 2.5);
    const lanternMaterial = lantern.material as THREE.MeshStandardMaterial;
    lanternMaterial.emissive = new THREE.Color(0xffb45e);
    lanternMaterial.emissiveIntensity = 1.1;
    this.root.add(lantern);

    const label = groundLabel("commons", zoneColor.commons);
    if (label) {
      label.position.set(area.x, 0.02, area.z + area.w / 2 - 0.5);
      this.root.add(label);
    }
  }

  private addTree(x: number, z: number, scale: number) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);
    tree.add(box(0.24, 1.2, 0.24, palette.timber, 0, 0.6, 0));

    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.92, 0),
      new THREE.MeshStandardMaterial({ color: palette.leaf, roughness: 1, flatShading: true })
    );
    crown.position.y = 1.6;
    crown.castShadow = true;
    tree.add(crown);
    this.root.add(tree);
  }

  private buildProjectPlot(project: Project, index: number) {
    const slots = [[-4.9, 0.15], [-1.7, 0.15], [1.6, 0.15], [4.9, 0.15], [-6.5, 6.1], [6.4, 6.0], [-2.2, 6.15], [2.1, 6.15]] as const;
    const [x, z] = slots[index % slots.length];
    const accent = Number.parseInt(project.color.replace("#", ""), 16) || zoneColor.build;
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.add(box(2.25, 0.12, 1.45, 0x6a4e3b, 0, 0.06, 0));
    for (const [w, d, px, pz] of [[2.25, 0.08, 0, -0.73], [2.25, 0.08, 0, 0.73], [0.08, 1.45, -1.1, 0], [0.08, 1.45, 1.1, 0]] as const) group.add(box(w, 0.18, d, accent, px, 0.16, pz));

    const growth = Math.max(0.12, project.progress / 100);
    for (let crop = 0; crop < 6; crop += 1) {
      const px = -0.72 + (crop % 3) * 0.72;
      const pz = -0.38 + Math.floor(crop / 3) * 0.7;
      const stemHeight = 0.24 + growth * 0.42;
      group.add(box(0.08, stemHeight, 0.08, 0x58754a, px, 0.15 + stemHeight / 2, pz));
      if (project.progress >= 20) {
        for (const side of [-1, 1] as const) {
          const leaf = box(0.18, 0.06, 0.11, palette.leaf, px + side * 0.1, 0.27 + growth * 0.28, pz);
          leaf.rotation.z = side * 0.42;
          leaf.castShadow = true;
          group.add(leaf);
        }
      }
      if (project.progress >= 40) {
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 + growth * 0.08, 0), new THREE.MeshStandardMaterial({ color: accent, roughness: 0.9, flatShading: true }));
        crown.position.set(px, 0.52 + growth * 0.38, pz);
        crown.castShadow = true;
        group.add(crown);
      }
    }

    const sign = new THREE.Group();
    sign.add(box(0.07, 0.7, 0.07, palette.timber, 0, 0.35, 0));
    sign.add(box(0.72, 0.26, 0.06, accent, 0.18, 0.72, 0));
    const tag = nameTag(`${project.name} ${project.progress}%`, accent);
    tag.scale.setScalar(0.8);
    tag.position.set(0.18, 0.75, 0.04);
    sign.add(tag);
    sign.position.set(-0.82, 0, -0.94);
    group.add(sign);

    if (project.readyToHarvest) {
      const markerMaterial = new THREE.MeshStandardMaterial({ color: 0xffd47f, emissive: 0xc87936, emissiveIntensity: 0.9, flatShading: true });
      const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), markerMaterial);
      marker.name = "ready-marker";
      marker.position.set(0, 1.28, 0);
      marker.castShadow = true;
      group.add(marker);
    }

    const selection = new THREE.Mesh(
      new THREE.RingGeometry(1.26, 1.37, 4),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    selection.name = "project-selection";
    selection.rotation.x = -Math.PI / 2;
    selection.position.y = 0.025;
    group.add(selection);
    return group;
  }

  setProjects(projects: Project[]) {
    const visible = projects.slice(0, 8);
    const keep = new Set(visible.map((project) => project.id));
    const disposeGroup = (group: THREE.Group) => group.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Sprite)) return;
      object.geometry?.dispose();
      const material = object.material;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else material?.dispose();
    });
    for (const [id, group] of this.projectPlots) {
      if (keep.has(id)) continue;
      this.root.remove(group);
      disposeGroup(group);
      this.projectPlots.delete(id);
    }
    visible.forEach((project, index) => {
      const previous = this.projectPlots.get(project.id);
      if (previous) { this.root.remove(previous); disposeGroup(previous); }
      const plot = this.buildProjectPlot(project, index);
      this.root.add(plot);
      this.projectPlots.set(project.id, plot);
    });
    this.setSelectedProject(this.selectedProjectId);
  }

  setSelectedProject(id: string | null) {
    this.selectedProjectId = id;
    for (const [projectId, group] of this.projectPlots) {
      const ring = group.getObjectByName("project-selection");
      if (ring) ring.visible = projectId === id;
    }
  }

  celebrateProject(id: string) {
    const plot = this.projectPlots.get(id);
    if (!plot) return;
    const ring = plot.getObjectByName("project-selection");
    const ringMaterial = ring instanceof THREE.Mesh ? ring.material as THREE.MeshBasicMaterial : null;
    const color = ringMaterial?.color.getHex() ?? 0xffd47f;
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.09 + (index % 2) * 0.025, 0),
        new THREE.MeshStandardMaterial({ color: index % 3 === 0 ? 0xffd47f : color, emissive: 0x6b4329, emissiveIntensity: 0.25, transparent: true, opacity: 1, flatShading: true })
      );
      mesh.position.set(plot.position.x, 0.85 + (index % 3) * 0.08, plot.position.z);
      this.root.add(mesh);
      this.celebrations.push({
        mesh,
        age: 0,
        velocity: new THREE.Vector3(Math.cos(angle) * 0.9, 1.2 + (index % 2) * 0.25, Math.sin(angle) * 0.9),
        spin: 1.8 + index * 0.12
      });
    }
  }

  focusOnProject(id: string) {
    const plot = this.projectPlots.get(id);
    if (!plot) return;
    this.focus.x = THREE.MathUtils.clamp(plot.position.x, -6, 6);
    this.focus.z = THREE.MathUtils.clamp(plot.position.z, -5, 5);
    this.zoom = 1.18;
    this.updateCamera();
  }

  private setupCamera() {
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    this.camera = new THREE.OrthographicCamera(-9 * aspect, 9 * aspect, 9, -9, 0.1, 120);
    this.updateCamera();
  }

  private updateCamera() {
    if (!this.camera) return;
    this.camera.position.set(this.focus.x + 16, 17, this.focus.z + 16);
    this.camera.lookAt(this.focus);
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
  }

  private resize = () => {
    if (!this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = Math.max(window.innerHeight, 1);
    const aspect = width / height;
    this.camera.left = -9 * aspect;
    this.camera.right = 9 * aspect;
    this.camera.top = 9;
    this.camera.bottom = -9;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private handlePointerDown = (event: PointerEvent) => {
    this.dragging = true;
    this.dragged = false;
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.focusStart = { x: this.focus.x, z: this.focus.z };
    this.canvas?.setPointerCapture(event.pointerId);
  };

  private handlePointerMove = (event: PointerEvent) => {
    if (!this.dragging) return;
    const dx = event.clientX - this.dragStart.x;
    const dy = event.clientY - this.dragStart.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) this.dragged = true;
    if (!this.dragged) return;
    this.focus.x = THREE.MathUtils.clamp(this.focusStart.x - dx / (46 * this.zoom), -5, 5);
    this.focus.z = THREE.MathUtils.clamp(this.focusStart.z + dy / (38 * this.zoom), -4, 4);
    this.updateCamera();
  };

  private handlePointerUp = (event: PointerEvent) => {
    if (!this.dragging) return;
    this.dragging = false;
    this.canvas?.releasePointerCapture(event.pointerId);
    if (!this.dragged) this.pick(event);
  };

  private handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    this.setZoom(this.zoom * (event.deltaY < 0 ? 1.12 : 0.89));
  };

  /** A click selects an agent or product plot; otherwise it walks the avatar. */
  private pick(event: PointerEvent) {
    if (!this.canvas || !this.camera) return;

    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    for (const [id, character] of this.agents) {
      if (this.raycaster.intersectObject(character.group, true).length > 0) {
        this.onSelectAgent(id);
        return;
      }
    }

    for (const [id, plot] of this.projectPlots) {
      if (this.raycaster.intersectObject(plot, true).length > 0) {
        this.onSelectProject(id);
        return;
      }
    }

    if (this.market && this.raycaster.intersectObject(this.market, true).length > 0) {
      this.onSelectMarket();
      return;
    }

    if (this.ground && this.self) {
      const [hit] = this.raycaster.intersectObject(this.ground, false);
      if (hit) {
        this.self.moveTo(hit.point.x, hit.point.z);
        return;
      }
    }

    this.onSelectAgent(null);
    this.onSelectProject(null);
  }

  setZoom(value: number) {
    this.zoom = THREE.MathUtils.clamp(value, 0.6, 2);
    this.updateCamera();
  }

  zoomIn() {
    this.setZoom(this.zoom * 1.12);
  }

  zoomOut() {
    this.setZoom(this.zoom * 0.89);
  }

  resetView() {
    this.zoom = 1;
    this.focus.set(0, 0, 0);
    this.updateCamera();
  }

  setAgents(agents: Agent[]) {
    // Agents that share a zone are spread evenly across it so their name tags
    // never sit on top of each other.
    const perZone = new Map<string, Agent[]>();
    for (const agent of agents) {
      const list = perZone.get(agent.zone) ?? [];
      list.push(agent);
      perZone.set(agent.zone, list);
    }

    for (const agent of agents) {
      if (this.agents.has(agent.id)) continue;
      const area = zoneLayout[agent.zone] ?? zoneLayout.build;
      const siblings = perZone.get(agent.zone) ?? [agent];
      const slot = (siblings.indexOf(agent) + 1) / (siblings.length + 1);
      const index = siblings.indexOf(agent);
      const position = new THREE.Vector3(
        area.x + (slot - 0.5) * (area.w - 1.4),
        0,
        // Stagger depth too, so two tags in one plot never sit on one line.
        area.z + area.d / 2 - 1.1 - (index % 2) * 1.05
      );
      const character = new Character(
        agent.name,
        Number.parseInt(agent.accent.slice(1), 16),
        palette.plaster,
        position,
        agent.id
      );
      this.root.add(character.group);
      this.agents.set(agent.id, character);
      this.workSlot.set(agent.id, siblings.indexOf(agent));
    }
  }

  setAgentState(id: AgentId, state: AgentState, zone: string) {
    const character = this.agents.get(id);
    if (!character) return;

    character.setBusy(state === "working");
    if (state !== "working") {
      character.moveTo(character.home.x, character.home.z);
      return;
    }

    // Stand at the zone's bench, offset so two busy agents never share a spot.
    const area = zoneLayout[zone] ?? zoneLayout.build;
    const slot = this.workSlot.get(id) ?? 0;
    character.moveTo(area.x + area.w / 2 - 1.4 - slot * 0.75, area.z + 0.6 + slot * 0.55);
  }

  /** Draws a fading arc from one agent to another to mark a handoff. */
  handoff(from: AgentId, to: AgentId) {
    const a = this.agents.get(from);
    const b = this.agents.get(to);
    if (!a || !b) return;

    const start = a.group.position.clone().setY(1.2);
    const end = b.group.position.clone().setY(1.2);
    const middle = start.clone().lerp(end, 0.5).setY(1.2 + start.distanceTo(end) * 0.24);
    const curve = new THREE.QuadraticBezierCurve3(start, middle, end);

    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(28)),
      new THREE.LineBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.9 })
    );
    this.root.add(line);
    this.arcs.push({ line, age: 0 });
  }

  setSelf(peer: Peer) {
    if (this.self) {
      this.self.moveTo(peer.x, peer.z);
      this.self.setLabel(peer.name, 0xe0a86b);
      return;
    }
    this.self = new Character(
      peer.name,
      0xf0d9a8,
      palette.human,
      new THREE.Vector3(peer.x, 0, peer.z),
      "self"
    );
    this.root.add(this.self.group);
  }

  setSelfStyle(avatar: AvatarProfile) {
    if (!this.self) return;
    const position = this.self.group.position.clone();
    this.self.dispose(this.root);
    const accent = Number.parseInt(avatar.accent.replace("#", ""), 16) || 0xe0a86b;
    const skin = Number.parseInt(avatar.skin.replace("#", ""), 16) || palette.human;
    this.self = new Character(avatar.name, accent, skin, position, "self");
    this.root.add(this.self.group);
  }

  upsertPeer(peer: Peer) {
    const existing = this.peers.get(peer.id);
    if (existing) {
      existing.moveTo(peer.x, peer.z);
      existing.setLabel(peer.name, 0xb9c4d4);
      return;
    }
    const character = new Character(
      peer.name,
      0xb9c4d4,
      palette.human,
      new THREE.Vector3(peer.x, 0, peer.z),
      "guest"
    );
    this.root.add(character.group);
    this.peers.set(peer.id, character);
  }

  updatePeer(peer: Peer) {
    if (peer.id === "") return;
    this.upsertPeer(peer);
  }

  movePeer(id: string, x: number, z: number) {
    this.peers.get(id)?.moveTo(x, z);
  }

  removePeer(id: string) {
    const character = this.peers.get(id);
    if (!character) return;
    character.dispose(this.root);
    this.peers.delete(id);
  }

  private reportSelf(now: number) {
    if (!this.self) return;

    const inside =
      Math.hypot(
        this.self.group.position.x - COMMONS.x,
        this.self.group.position.z - COMMONS.z
      ) < COMMONS.w / 2;

    if (inside !== this.selfInCommons) {
      this.selfInCommons = inside;
      this.onCommonsChange(inside);
    }

    // Throttled so walking does not flood the relay.
    if (now - this.lastReport > 220) {
      this.lastReport = now;
      this.onSelfMoved(this.self.group.position.x, this.self.group.position.z);
    }
  }

  private tick = (time: number) => {
    if (this.disposed || !this.renderer || !this.camera) return;
    this.frame = requestAnimationFrame(this.tick);

    const delta = Math.min(0.05, Math.max(0.001, (time - this.lastTime) / 1000));
    this.lastTime = time;
    const elapsed = time / 1000;

    const water = this.root.getObjectByName("pond-water");
    if (water) {
      const ripple = 1 + Math.sin(elapsed * 1.8) * 0.008;
      water.scale.set(ripple, ripple, 1);
    }
    const windmill = this.root.getObjectByName("windmill-blades");
    if (windmill) windmill.rotation.z += delta * 0.7;

    for (const character of this.agents.values()) character.update(delta, elapsed);
    for (const character of this.peers.values()) character.update(delta, elapsed);
    this.self?.update(delta, elapsed);
    for (const critter of this.critters) {
      const walk = Math.sin(elapsed * critter.speed + critter.phase);
      critter.group.position.x = critter.origin.x + walk * 0.58;
      critter.group.position.z = critter.origin.z + Math.cos(elapsed * critter.speed * 0.8 + critter.phase) * 0.28;
      critter.group.position.y = Math.max(0, walk) * 0.035;
      critter.group.rotation.y = walk > 0 ? 0.42 : -0.42;
    }
    for (let index = this.celebrations.length - 1; index >= 0; index -= 1) {
      const celebration = this.celebrations[index];
      celebration.age += delta;
      celebration.velocity.y -= delta * 2.2;
      celebration.mesh.position.addScaledVector(celebration.velocity, delta);
      celebration.mesh.rotation.x += delta * celebration.spin;
      celebration.mesh.rotation.z += delta * celebration.spin * 0.7;
      const material = celebration.mesh.material as THREE.MeshStandardMaterial;
      material.opacity = Math.max(0, 1 - celebration.age / 1.5);
      if (celebration.age >= 1.5) {
        this.root.remove(celebration.mesh);
        celebration.mesh.geometry.dispose();
        material.dispose();
        this.celebrations.splice(index, 1);
      }
    }
    this.reportSelf(time);

    const selectedPlot = this.selectedProjectId ? this.projectPlots.get(this.selectedProjectId) : null;
    const selection = selectedPlot?.getObjectByName("project-selection");
    if (selection instanceof THREE.Mesh) {
      const material = selection.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + Math.sin(elapsed * 4) * 0.1;
      selection.rotation.z += delta * 0.22;
    }
    for (const group of this.projectPlots.values()) {
      const marker = group.getObjectByName("ready-marker");
      if (marker) {
        marker.position.y = 1.28 + Math.sin(elapsed * 3.2) * 0.08;
        marker.rotation.y += delta * 1.5;
      }
    }

    for (let index = this.arcs.length - 1; index >= 0; index -= 1) {
      const arc = this.arcs[index];
      arc.age += delta;
      const material = arc.line.material as THREE.LineBasicMaterial;
      material.opacity = Math.max(0, 1 - arc.age / 1.4);
      if (arc.age >= 1.4) {
        this.root.remove(arc.line);
        arc.line.geometry.dispose();
        material.dispose();
        this.arcs.splice(index, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame);

    this.canvas?.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas?.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas?.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas?.removeEventListener("wheel", this.handleWheel);
    window.removeEventListener("resize", this.resize);

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        object.geometry?.dispose();
        const material = object.material;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material?.dispose();
      }
    });

    this.renderer?.dispose();
    this.renderer = null;
    this.agents.clear();
    this.peers.clear();
    this.critters.length = 0;
    this.celebrations.length = 0;
    this.market = null;
    this.projectPlots.clear();
    this.arcs.length = 0;
  }
}
