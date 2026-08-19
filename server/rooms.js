import { config } from "./config.js";
import { sanitizeText } from "./security.js";

/**
 * Presence and WebRTC signalling.
 *
 * The relay never sees media: it only forwards SDP and ICE payloads between two
 * peers that are both in the meeting room. Peer ids are assigned by the server,
 * so a client cannot impersonate another participant by choosing its own id.
 */

/** @type {Map<string, {id: string, name: string, x: number, z: number, inRoom: boolean, send: (msg: unknown) => void}>} */
const peers = new Map();

const MAX_SIGNAL_BYTES = 16 * 1024;
const NAME_MAX = 24;

const publicPeer = (peer) => ({
  id: peer.id,
  name: peer.name,
  x: peer.x,
  z: peer.z,
  inRoom: peer.inRoom
});

const clamp = (value, min, max) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : 0;

const sendTo = (id, message) => peers.get(id)?.send(message);

const broadcast = (message, exceptId = null) => {
  for (const peer of peers.values()) {
    if (peer.id !== exceptId) peer.send(message);
  }
};

// Arrivals stand on the south lane, clear of the commons circle — walking in
// is what joins the call, so nobody should start out already in it.
// The main street, one step short of the commons: a guest lands in the middle
// of the village without the proximity call opening a camera on arrival.
const SPAWN = { x: 0.25, z: -2.5 };

export const addPeer = (id, send) => {
  const peer = { id, name: "Guest", x: SPAWN.x, z: SPAWN.z, inRoom: false, send };
  peers.set(id, peer);
  send({ type: "presence:self", data: { id } });
  send({ type: "presence:list", data: [...peers.values()].map(publicPeer) });
  broadcast({ type: "presence:join", data: publicPeer(peer) }, id);
  return peer;
};

export const removePeer = (id) => {
  const peer = peers.get(id);
  if (!peer) return;
  if (peer.inRoom) leaveRoom(id);
  peers.delete(id);
  broadcast({ type: "presence:leave", data: { id } });
};

export const setName = (id, rawName) => {
  const peer = peers.get(id);
  if (!peer) return;
  peer.name = sanitizeText(rawName, NAME_MAX) || "Guest";
  broadcast({ type: "presence:update", data: publicPeer(peer) });
};

export const movePeer = (id, x, z) => {
  const peer = peers.get(id);
  if (!peer) return;
  peer.x = clamp(Number(x), -11, 11);
  peer.z = clamp(Number(z), -7, 7);
  broadcast({ type: "presence:move", data: { id, x: peer.x, z: peer.z } }, id);
};

export const joinRoom = (id) => {
  const peer = peers.get(id);
  if (!peer || peer.inRoom) return;

  const members = [...peers.values()].filter((candidate) => candidate.inRoom);
  if (members.length >= config.limits.roomCapacity) {
    peer.send({ type: "room:full", data: { capacity: config.limits.roomCapacity } });
    return;
  }

  peer.inRoom = true;
  // The newcomer learns who is already there and is responsible for making the
  // offers, which keeps negotiation one-directional and glare-free.
  peer.send({ type: "room:joined", data: { peers: members.map(publicPeer) } });
  for (const member of members) {
    member.send({ type: "room:peer-joined", data: publicPeer(peer) });
  }
  broadcast({ type: "presence:update", data: publicPeer(peer) });
};

export const leaveRoom = (id) => {
  const peer = peers.get(id);
  if (!peer || !peer.inRoom) return;
  peer.inRoom = false;
  for (const member of peers.values()) {
    if (member.inRoom) member.send({ type: "room:peer-left", data: { id } });
  }
  broadcast({ type: "presence:update", data: publicPeer(peer) });
};

/**
 * Forwards one signalling payload. Both ends must be in the room, and the
 * sender identity is stamped by the server rather than trusted from the client.
 */
export const relaySignal = (fromId, toId, payload) => {
  const from = peers.get(fromId);
  const to = peers.get(toId);
  if (!from?.inRoom || !to?.inRoom) return;
  if (typeof toId !== "string") return;

  const encoded = JSON.stringify(payload ?? null);
  if (!encoded || encoded.length > MAX_SIGNAL_BYTES) return;

  sendTo(toId, { type: "rtc:signal", data: { from: fromId, payload } });
};

export const presenceList = () => [...peers.values()].map(publicPeer);

export const peerCount = () => peers.size;
