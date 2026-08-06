/**
 * A small WebRTC mesh for the meeting room.
 *
 * Media is peer-to-peer; the relay only forwards SDP and ICE. The peer that
 * arrives last makes the offers, which keeps negotiation one-directional and
 * avoids glare without a full perfect-negotiation implementation.
 *
 * Public STUN is enough for the same machine or the same LAN. Crossing a
 * symmetric NAT needs a TURN server — set one via VITE_TURN_URL / _USER /
 * _CREDENTIAL rather than committing credentials.
 */

const iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

const turnUrl = import.meta.env.VITE_TURN_URL;
if (turnUrl) {
  iceServers.push({
    urls: turnUrl,
    username: import.meta.env.VITE_TURN_USER,
    credential: import.meta.env.VITE_TURN_CREDENTIAL
  });
}

type Signal =
  | { kind: "offer"; sdp: RTCSessionDescriptionInit }
  | { kind: "answer"; sdp: RTCSessionDescriptionInit }
  | { kind: "candidate"; candidate: RTCIceCandidateInit };

interface MeshOptions {
  send: (to: string, payload: Signal) => void;
  onStream: (peerId: string, stream: MediaStream) => void;
  onClosed: (peerId: string) => void;
}

export class CallMesh {
  #connections = new Map<string, RTCPeerConnection>();
  #local: MediaStream | null = null;
  #options: MeshOptions;

  constructor(options: MeshOptions) {
    this.#options = options;
  }

  setLocalStream(stream: MediaStream | null) {
    this.#local = stream;
    for (const connection of this.#connections.values()) {
      for (const sender of connection.getSenders()) {
        const track = stream?.getTracks().find((candidate) => candidate.kind === sender.track?.kind);
        void sender.replaceTrack(track ?? null);
      }
    }
  }

  #peer(peerId: string): RTCPeerConnection {
    const existing = this.#connections.get(peerId);
    if (existing) return existing;

    const connection = new RTCPeerConnection({ iceServers });
    this.#connections.set(peerId, connection);

    if (this.#local) {
      for (const track of this.#local.getTracks()) connection.addTrack(track, this.#local);
    } else {
      // Stay receive-only until the operator grants camera access.
      connection.addTransceiver("video", { direction: "recvonly" });
      connection.addTransceiver("audio", { direction: "recvonly" });
    }

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.#options.send(peerId, { kind: "candidate", candidate: event.candidate.toJSON() });
      }
    };

    connection.ontrack = (event) => {
      if (event.streams[0]) this.#options.onStream(peerId, event.streams[0]);
    };

    connection.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(connection.connectionState)) {
        this.remove(peerId);
      }
    };

    return connection;
  }

  /** Called for peers that were already in the room when we joined. */
  async call(peerId: string) {
    const connection = this.#peer(peerId);
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    this.#options.send(peerId, { kind: "offer", sdp: offer });
  }

  async accept(peerId: string, signal: Signal) {
    const connection = this.#peer(peerId);

    if (signal.kind === "offer") {
      await connection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      this.#options.send(peerId, { kind: "answer", sdp: answer });
      return;
    }

    if (signal.kind === "answer") {
      if (connection.signalingState === "have-local-offer") {
        await connection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      }
      return;
    }

    // Candidates that arrive before the remote description would throw.
    if (connection.remoteDescription) {
      await connection.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  }

  remove(peerId: string) {
    const connection = this.#connections.get(peerId);
    if (!connection) return;
    connection.onicecandidate = null;
    connection.ontrack = null;
    connection.onconnectionstatechange = null;
    connection.close();
    this.#connections.delete(peerId);
    this.#options.onClosed(peerId);
  }

  destroy() {
    for (const peerId of [...this.#connections.keys()]) this.remove(peerId);
    this.#local?.getTracks().forEach((track) => track.stop());
    this.#local = null;
  }
}

export const isSignal = (value: unknown): value is Signal => {
  if (!value || typeof value !== "object") return false;
  const kind = (value as { kind?: unknown }).kind;
  return kind === "offer" || kind === "answer" || kind === "candidate";
};
