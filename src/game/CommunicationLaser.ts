import * as PIXI from "pixi.js";

export class CommunicationLaser {
  container: PIXI.Container;
  private graphics: PIXI.Graphics;
  private p1: { x: number; y: number };
  private p2: { x: number; y: number };
  private color: number;

  private life = 1.0; // 1.0 down to 0
  private particles: { t: number; speed: number; size: number }[] = [];
  isAlive = true;

  constructor(parent: PIXI.Container, p1: { x: number; y: number }, p2: { x: number; y: number }, color: number = 0x38bdf8) {
    this.container = new PIXI.Container();
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);
    parent.addChild(this.container);

    this.p1 = p1;
    this.p2 = p2;
    this.color = color;

    // Spawn 5 traveling energy particles
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        t: Math.random(),
        speed: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 2.5
      });
    }
  }

  update(delta: number) {
    if (!this.isAlive) return;

    this.life -= delta * 0.015; // ~2.5 seconds lifetime
    if (this.life <= 0) {
      this.isAlive = false;
      this.container.parent?.removeChild(this.container);
      return;
    }

    this.graphics.clear();

    // Outer Laser Glow Line
    this.graphics.moveTo(this.p1.x, this.p1.y);
    this.graphics.lineTo(this.p2.x, this.p2.y);
    this.graphics.stroke({ width: 6, color: this.color, alpha: this.life * 0.35 });

    // Inner Core Laser Beam
    this.graphics.moveTo(this.p1.x, this.p1.y);
    this.graphics.lineTo(this.p2.x, this.p2.y);
    this.graphics.stroke({ width: 2, color: 0xffffff, alpha: this.life * 0.9 });

    // Render Traveling Energy Particles
    for (const p of this.particles) {
      p.t += p.speed * delta;
      if (p.t > 1) p.t = 0;

      const px = this.p1.x + (this.p2.x - this.p1.x) * p.t;
      const py = this.p1.y + (this.p2.y - this.p1.y) * p.t;

      this.graphics.circle(px, py, p.size);
      this.graphics.fill({ color: 0xffffff, alpha: this.life });
    }
  }
}
