/**
 * Distance and direction for the commons call.
 *
 * The mesh already delivers every peer's audio and the map already broadcasts
 * every peer's position ten times a second. This is the graph that joins them:
 * one source, one low-pass and one panner per peer, so somebody across the
 * plaza sounds like they are across the plaza.
 *
 * Panning is `equalpower`, not HRTF. The village is seen from above and the
 * avatar has no face, so there is no front or back to model — azimuth and
 * distance are the whole story, and HRTF would only add a colouration that
 * changes as people walk behind a listener who is not facing anywhere.
 */

/** World units. Inside this radius a peer is simply at full volume. */
const REF_DISTANCE = 1.5;
/** Past this, attenuation stops; the commons is about 6.5 units across. */
const MAX_DISTANCE = 10;
const ROLLOFF = 1.4;

const NEAR_CUTOFF = 18000;
const FAR_CUTOFF = 700;
/** Distance at which the low-pass has fully closed. */
const MUFFLE_AT = 8;

/**
 * Air and distance eat treble long before they eat volume, and that is most of
 * what makes a sound read as far away. Hearing is logarithmic, so the sweep
 * between the two cutoffs is too.
 */
export const cutoffForDistance = (distance: number) => {
  const t = Math.min(1, Math.max(0, distance / MUFFLE_AT));
  return NEAR_CUTOFF * Math.pow(FAR_CUTOFF / NEAR_CUTOFF, t);
};

/** Positions arrive in steps; ramp to them or every step is a click. */
const RAMP = 0.06;

const ramp = (param: AudioParam, value: number, now: number) =>
  param.setTargetAtTime(value, now, RAMP);

interface Voice {
  source: MediaStreamAudioSourceNode;
  filter: BiquadFilterNode;
  panner: PannerNode;
  /** Chrome's keep-alive, see attach(). Never actually heard. */
  sink: HTMLAudioElement;
  x: number;
  z: number;
}

export class SpatialAudio {
  #context: AudioContext | null = null;
  #voices = new Map<string, Voice>();
  #listener = { x: 0, z: 0 };

  /** Throws rather than returning null: the caller unmutes the tiles on failure,
   *  and a silent no-op here would leave them muted with nothing feeding them. */
  #ensure(): AudioContext {
    if (this.#context) {
      // Autoplay policy can leave a context suspended even after a gesture.
      if (this.#context.state === "suspended") void this.#context.resume();
      return this.#context;
    }
    const Ctor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error("Web Audio unavailable");
    this.#context = new Ctor();
    return this.#context;
  }

  /**
   * Each voice owns a muted <audio> element it is never heard through. That is
   * not superstition and it is not dead code: a remote WebRTC stream feeds Web
   * Audio pure silence in Chrome unless the stream is also attached to a media
   * element. Measured on a loopback RTCPeerConnection carrying a 440 Hz tone —
   * without the element the analyser peaks at 0.0000, with it at 0.5039 and the
   * dominant bin lands on 445 Hz. Delete the sink and the commons goes mute.
   *
   * Borrowing CallDock's <video> would have worked too, right up until the dock
   * stopped rendering a tile and the peer went silent for no visible reason.
   */
  attach(peerId: string, stream: MediaStream) {
    if (this.#voices.has(peerId)) this.detach(peerId);
    if (stream.getAudioTracks().length === 0) return;
    const context = this.#ensure();

    const sink = new Audio();
    sink.srcObject = stream;
    sink.muted = true;
    void sink.play().catch(() => undefined);

    const source = context.createMediaStreamSource(stream);
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = NEAR_CUTOFF;

    const panner = context.createPanner();
    panner.panningModel = "equalpower";
    panner.distanceModel = "inverse";
    panner.refDistance = REF_DISTANCE;
    panner.maxDistance = MAX_DISTANCE;
    panner.rolloffFactor = ROLLOFF;

    source.connect(filter).connect(panner).connect(context.destination);
    const voice: Voice = { source, filter, panner, sink, x: this.#listener.x, z: this.#listener.z };
    this.#voices.set(peerId, voice);
    this.#apply(voice);
  }

  place(peerId: string, x: number, z: number) {
    const voice = this.#voices.get(peerId);
    if (!voice) return;
    voice.x = x;
    voice.z = z;
    this.#apply(voice);
  }

  listener(x: number, z: number) {
    this.#listener = { x, z };
    const context = this.#context;
    if (context) {
      const { listener } = context;
      const now = context.currentTime;
      if (listener.positionX) {
        ramp(listener.positionX, x, now);
        ramp(listener.positionZ, z, now);
      } else {
        // Safari kept the deprecated call long after the AudioParams landed.
        listener.setPosition?.(x, 0, z);
      }
    }
    for (const voice of this.#voices.values()) this.#apply(voice);
  }

  #apply(voice: Voice) {
    const context = this.#context;
    if (!context) return;
    const now = context.currentTime;

    if (voice.panner.positionX) {
      ramp(voice.panner.positionX, voice.x, now);
      ramp(voice.panner.positionZ, voice.z, now);
    } else {
      voice.panner.setPosition?.(voice.x, 0, voice.z);
    }

    const distance = Math.hypot(voice.x - this.#listener.x, voice.z - this.#listener.z);
    ramp(voice.filter.frequency, cutoffForDistance(distance), now);
  }

  detach(peerId: string) {
    const voice = this.#voices.get(peerId);
    if (!voice) return;
    voice.source.disconnect();
    voice.filter.disconnect();
    voice.panner.disconnect();
    voice.sink.pause();
    voice.sink.srcObject = null;
    this.#voices.delete(peerId);
  }

  /** Leaving the commons: drop the voices, keep the context for the next visit. */
  reset() {
    for (const peerId of [...this.#voices.keys()]) this.detach(peerId);
  }

  destroy() {
    this.reset();
    void this.#context?.close();
    this.#context = null;
  }
}
