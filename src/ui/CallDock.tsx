import { useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import type { Peer } from "./shared";

interface Props {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  peers: Peer[];
  micOn: boolean;
  camOn: boolean;
  error: string | null;
  flatAudio: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onLeave: () => void;
}

/**
 * Remote tiles are muted while the spatial graph is carrying the audio —
 * unmuting them would play every peer twice, once flat. If that graph could not
 * be built, `flatAudio` hands the sound back to the elements: worse, but not
 * silent.
 */
const Tile = ({ stream, label, muted }: { stream: MediaStream; label: string; muted: boolean }) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || element.srcObject === stream) return;
    element.srcObject = stream;
    // Autoplay can be refused before a gesture; the call button is that gesture.
    void element.play().catch(() => undefined);
  }, [stream]);

  return (
    <figure className="tile">
      <video ref={ref} autoPlay playsInline muted={muted} />
      <figcaption>{label}</figcaption>
    </figure>
  );
};

/** Appears only while you are standing in the commons. */
export const CallDock = ({
  localStream,
  remoteStreams,
  peers,
  micOn,
  camOn,
  error,
  flatAudio,
  onToggleMic,
  onToggleCam,
  onLeave
}: Props) => {
  const nameOf = (id: string) => peers.find((peer) => peer.id === id)?.name ?? "Guest";

  return (
    <section className="panel call" aria-label="Commons call">
      <div className="call__tiles">
        {localStream ? (
          <Tile stream={localStream} label="You" muted />
        ) : (
          <p className="call__hint">{error ?? "Camera off — you are here, listening."}</p>
        )}
        {[...remoteStreams].map(([id, stream]) => (
          <Tile key={id} stream={stream} label={nameOf(id)} muted={!flatAudio} />
        ))}
      </div>

      <div className="call__controls">
        <button type="button" className="icon" onClick={onToggleMic} aria-label="Toggle microphone">
          {micOn ? <Mic size={16} /> : <MicOff size={16} />}
        </button>
        <button type="button" className="icon" onClick={onToggleCam} aria-label="Toggle camera">
          {camOn ? <Video size={16} /> : <VideoOff size={16} />}
        </button>
        <button type="button" className="icon icon--danger" onClick={onLeave} aria-label="Leave call">
          <PhoneOff size={16} />
        </button>
      </div>
    </section>
  );
};
