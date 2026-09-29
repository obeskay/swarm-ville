import { useCallback, useEffect, useRef, useState } from "react";
import { CallMesh, isSignal } from "./rtc";
import { SpatialAudio } from "./spatial";
import { t } from "./i18n";
import type { ServerMessage } from "../types";

interface Options {
  send: (message: unknown) => void;
}

/**
 * The proximity call: media, the peer mesh and spatial audio, behind one hook.
 * Walking into the commons and pressing the call button are the same action, so
 * the world only ever needs `join` and `leave`.
 */
export const useCall = ({ send }: Options) => {
  const meshRef = useRef<CallMesh | null>(null);
  const spatialRef = useRef<SpatialAudio | null>(null);
  // Where everyone last stood. Someone who is not moving sends nothing new, so
  // their voice can only be placed from what we already know.
  const positions = useRef(new Map<string, { x: number; z: number }>());

  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  // Set when the spatial graph cannot be built: the bubbles play the audio flat.
  const [flatAudio, setFlatAudio] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mesh = new CallMesh({
      send: (to, payload) => send({ type: "rtc:signal", to, payload }),
      onStream: (peerId, stream) => {
        // Show the person first: a fault in the audio graph must never cost you
        // the video of whoever you are talking to.
        setRemoteStreams((previous) => new Map(previous).set(peerId, stream));
        try {
          spatialRef.current?.attach(peerId, stream);
          const at = positions.current.get(peerId);
          if (at) spatialRef.current?.place(peerId, at.x, at.z);
        } catch (failure) {
          console.warn("[call] spatial audio unavailable, the video carries the sound", failure);
          setFlatAudio(true);
        }
      },
      onClosed: (peerId) => {
        spatialRef.current?.detach(peerId);
        setRemoteStreams((previous) => {
          const next = new Map(previous);
          next.delete(peerId);
          return next;
        });
      }
    });
    meshRef.current = mesh;
    spatialRef.current = new SpatialAudio();
    return () => {
      mesh.destroy();
      meshRef.current = null;
      spatialRef.current?.destroy();
      spatialRef.current = null;
    };
  }, [send]);

  const join = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      meshRef.current?.setLocalStream(stream);
      setLocalStream(stream);
      setMicOn(true);
      setCamOn(true);
    } catch {
      // Being in the room without a camera is a valid way to attend.
      setError(t("call.listener"));
    }
    setInCall(true);
    send({ type: "room:join" });
  }, [send]);

  const leave = useCallback(() => {
    send({ type: "room:leave" });
    meshRef.current?.setLocalStream(null);
    setLocalStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
    setRemoteStreams(new Map());
    spatialRef.current?.reset();
    setInCall(false);
    setError(null);
  }, [send]);

  const toggle = (stream: MediaStream | null, kind: "audio" | "video") => {
    const track = stream?.getTracks().find((entry) => entry.kind === kind);
    if (!track) return false;
    track.enabled = !track.enabled;
    return track.enabled;
  };

  /** Where the listener stands, so sound pans and fades with distance. */
  const listen = useCallback((x: number, z: number) => spatialRef.current?.listener(x, z), []);

  /** Feeds the call the relay messages that are its business; ignores the rest. */
  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case "room:joined":
        // We arrived last, so we place the calls.
        for (const peer of message.data.peers) void meshRef.current?.call(peer.id);
        return;
      case "room:peer-left":
        meshRef.current?.remove(message.data.id);
        return;
      case "presence:leave":
        positions.current.delete(message.data.id);
        meshRef.current?.remove(message.data.id);
        return;
      case "room:full":
        setError(t("call.full", { n: message.data.capacity }));
        setInCall(false);
        return;
      case "rtc:signal":
        if (isSignal(message.data.payload)) void meshRef.current?.accept(message.data.from, message.data.payload);
        return;
      case "presence:list":
        for (const peer of message.data) positions.current.set(peer.id, { x: peer.x, z: peer.z });
        return;
      case "presence:join":
      case "presence:update":
        positions.current.set(message.data.id, { x: message.data.x, z: message.data.z });
        spatialRef.current?.place(message.data.id, message.data.x, message.data.z);
        return;
      case "presence:move":
        positions.current.set(message.data.id, { x: message.data.x, z: message.data.z });
        spatialRef.current?.place(message.data.id, message.data.x, message.data.z);
        return;
      default:
    }
  }, []);

  return {
    inCall,
    localStream,
    remoteStreams,
    flatAudio,
    micOn,
    camOn,
    error,
    join,
    leave,
    toggleMic: () => setMicOn(toggle(localStream, "audio")),
    toggleCam: () => setCamOn(toggle(localStream, "video")),
    listen,
    handleMessage
  };
};
