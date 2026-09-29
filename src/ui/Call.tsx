import { useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { peerColor } from "../world/theme";
import type { World } from "../world/World";
import { t } from "../lib/i18n";
import { initial } from "./shared";
import type { Peer } from "./shared";

interface BubbleProps {
  name: string;
  color: string;
  stream: MediaStream | null;
  /** Remote bubbles are muted while spatial audio carries the sound; see below. */
  muted: boolean;
  camOff?: boolean;
  micOff?: boolean;
  setRef: (element: HTMLElement | null) => void;
}

const Bubble = ({ name, color, stream, muted, camOff, micOff, setRef }: BubbleProps) => {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = video.current;
    if (!element || !stream || element.srcObject === stream) return;
    element.srcObject = stream;
    // Autoplay can be refused before a gesture; joining the call is that gesture.
    void element.play().catch(() => undefined);
  }, [stream, camOff]);

  const showVideo = stream !== null && stream.getVideoTracks().length > 0 && !camOff;

  return (
    <figure className="bubble" ref={setRef} aria-label={name}>
      <div className="bubble__face sq" style={{ background: color }}>
        {showVideo ? <video ref={video} autoPlay playsInline muted={muted} /> : <span>{initial(name)}</span>}
        {micOff && (
          <i className="bubble__mute">
            <MicOff size={11} />
          </i>
        )}
      </div>
      <i className="bubble__dot" style={{ background: color }} />
    </figure>
  );
};

interface BubblesProps {
  getWorld: () => World | null;
  selfId: string | null;
  peers: Peer[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  inCall: boolean;
  camOn: boolean;
  micOn: boolean;
  flatAudio: boolean;
  selfName: string;
}

/**
 * Faces above heads. Each bubble hangs from its owner's head in the world, so
 * it walks with them; positions are written straight to the DOM every frame
 * rather than through React, which would re-render the call sixty times a second.
 *
 * Remote video is muted while the spatial graph carries the audio — unmuting it
 * would play every person twice, once flat. If that graph could not be built,
 * `flatAudio` hands the sound back to the elements: worse, but not silent.
 */
export const CallBubbles = ({ getWorld, selfId, peers, localStream, remoteStreams, inCall, camOn, micOn, flatAudio, selfName }: BubblesProps) => {
  const nodes = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    let frame = 0;
    const follow = () => {
      const world = getWorld();
      for (const [id, node] of nodes.current) {
        const head = world?.headOf(id);
        node.style.opacity = head ? "1" : "0";
        if (head) node.style.transform = `translate(${Math.round(head.x)}px, ${Math.round(head.y)}px)`;
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [getWorld]);

  const nameOf = (id: string) => peers.find((peer) => peer.id === id)?.name ?? t("guest");
  const ref = (id: string) => (element: HTMLElement | null) => {
    if (element) nodes.current.set(id, element);
    else nodes.current.delete(id);
  };

  return (
    <div className="bubbles" aria-hidden={!inCall}>
      {inCall && selfId && (
        <Bubble name={selfName} color={peerColor(selfId)} stream={localStream} muted camOff={!camOn} micOff={!micOn} setRef={ref(selfId)} />
      )}
      {inCall &&
        [...remoteStreams].map(([id, stream]) => (
          <Bubble key={id} name={nameOf(id)} color={peerColor(id)} stream={stream} muted={!flatAudio} setRef={ref(id)} />
        ))}
    </div>
  );
};

interface ControlsProps {
  micOn: boolean;
  camOn: boolean;
  hasCamera: boolean;
  error: string | null;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onLeave: () => void;
}

/** Appears only while you are on the call. */
export const CallControls = ({ micOn, camOn, hasCamera, error, onToggleMic, onToggleCam, onLeave }: ControlsProps) => (
  <div className="call sq" role="group" aria-label={t("call.join")}>
    {error && <p className="call__note">{error}</p>}
    <button type="button" className={`icon-btn sq ${micOn ? "" : "icon-btn--off"}`} onClick={onToggleMic} disabled={!hasCamera} aria-pressed={micOn} aria-label={t("call.mic")} title={t("call.mic")}>
      {micOn ? <Mic size={17} /> : <MicOff size={17} />}
    </button>
    <button type="button" className={`icon-btn sq ${camOn ? "" : "icon-btn--off"}`} onClick={onToggleCam} disabled={!hasCamera} aria-pressed={camOn} aria-label={t("call.cam")} title={t("call.cam")}>
      {camOn ? <Video size={17} /> : <VideoOff size={17} />}
    </button>
    <button type="button" className="icon-btn icon-btn--danger sq" onClick={onLeave} aria-label={t("call.leave")} title={t("call.leave")}>
      <PhoneOff size={17} />
    </button>
  </div>
);
