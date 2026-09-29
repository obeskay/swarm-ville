/**
 * Soft sounds, synthesised on the spot: a few sine blips, no audio files. They
 * are the small "yes, that worked" that makes a gesture feel real. Off with one
 * switch in Settings, and on a phone a tiny vibration goes with them.
 */

const STORAGE = "swarm-ville.sound.v1";

let context: AudioContext | null = null;
let enabled = (() => {
  try {
    return window.localStorage.getItem(STORAGE) !== "off";
  } catch {
    return true;
  }
})();

export const soundOn = () => enabled;

export const setSound = (on: boolean) => {
  enabled = on;
  try {
    window.localStorage.setItem(STORAGE, on ? "on" : "off");
  } catch {
    // The choice still applies for this session.
  }
};

const audio = () => {
  if (!context) {
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  // Autoplay rules can leave it suspended until the next gesture.
  if (context.state === "suspended") void context.resume();
  return context;
};

interface Tone {
  type?: OscillatorType;
  gain?: number;
  /** Glide to this pitch over the note. */
  to?: number;
}

const tone = (freq: number, at: number, length: number, { type = "sine", gain = 0.07, to }: Tone = {}) => {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + length);
  // A quick attack and an exponential fall: no clicks, no ringing.
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(amp).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + length + 0.03);
};

const play = (notes: () => void, buzz = 0) => {
  if (buzz && "vibrate" in navigator) navigator.vibrate(buzz);
  if (!enabled) return;
  try {
    notes();
  } catch {
    // Sound is a garnish; never let it break the gesture it decorates.
  }
};

export const sfx = {
  /** Picking your agent up. */
  pick: () => play(() => tone(520, 0, 0.1, { to: 780 }), 8),
  /** Setting it down: a soft thud and a bright pop on top. */
  drop: () =>
    play(() => {
      tone(230, 0, 0.18, { gain: 0.12, to: 110 });
      tone(660, 0.05, 0.12, { type: "triangle", gain: 0.05 });
    }, 14),
  /** Backing an idea. */
  back: () => play(() => tone(880, 0, 0.08, { type: "triangle", gain: 0.06 }), 8),
  /** A run finished: a little rising chime. */
  done: () => play(() => [523, 659, 784, 1047].forEach((freq, index) => tone(freq, index * 0.09, 0.32, { gain: 0.06 })), 20),
  error: () => play(() => tone(210, 0, 0.22, { type: "sawtooth", gain: 0.035, to: 130 })),
  /** Sending a reaction. */
  emote: () => play(() => tone(700, 0, 0.09, { gain: 0.06, to: 1150 }), 6)
};
