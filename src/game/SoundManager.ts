/**
 * Simple sound manager using Web Audio API for agent events.
 * Creates procedural sounds without external audio files.
 */
export class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;

  constructor() {
    // Initialize on first user interaction
    if (typeof window !== "undefined") {
      const initAudio = () => {
        if (!this.audioContext) {
          this.audioContext = new AudioContext();
        }
        window.removeEventListener("click", initAudio);
        window.removeEventListener("keydown", initAudio);
      };
      window.addEventListener("click", initAudio);
      window.addEventListener("keydown", initAudio);
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext();
      } catch {
        console.warn("[SoundManager] Web Audio API not available");
        return null;
      }
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Play a simple beep sound
   */
  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    fadeOut: boolean = true
  ): void {
    if (!this.enabled) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
    if (fadeOut) {
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  /**
   * Agent spawned - rising tone
   */
  playSpawn(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  /**
   * Agent message - soft notification
   */
  playMessage(): void {
    this.playTone(880, 0.1, "sine", true);
  }

  /**
   * Agent completed - success chime (two notes)
   */
  playComplete(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // First note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    gain1.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // Second note (higher)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.3);
  }

  /**
   * Agent error - low buzz
   */
  playError(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "square";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.setValueAtTime(120, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  }

  /**
   * UI click - subtle click
   */
  playClick(): void {
    this.playTone(1200, 0.05, "sine", true);
  }

  /**
   * Connection established
   */
  playConnect(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Three quick ascending notes
    [440, 554.37, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const startTime = ctx.currentTime + i * 0.08;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(this.volume * 0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
  }

  /**
   * Connection lost
   */
  playDisconnect(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Two descending notes
    [440, 330].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const startTime = ctx.currentTime + i * 0.15;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(this.volume * 0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
export const soundManager = new SoundManager();
