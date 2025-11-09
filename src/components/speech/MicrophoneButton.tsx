import { useEffect, useState } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import "./MicrophoneButton.css";

export default function MicrophoneButton() {
  const { isRecording, transcript, startRecording, stopRecording } =
    useSpeechToText({
      autoSendToNearestAgent: true,
    });
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (transcript && !isRecording) {
      setShowTranscript(true);
      const timer = setTimeout(() => setShowTranscript(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [transcript, isRecording]);

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      setError(null);
      startRecording();
    }
  };

  return (
    <div className="microphone-container">
      <button
        onClick={handleClick}
        className={`microphone-btn ${isRecording ? "recording" : ""} ${
          error ? "error" : ""
        }`}
        title={
          isRecording
            ? "Stop recording (release)"
            : "Start recording (Ctrl+Space or click)"
        }
        disabled={!!error}
      >
        {error ? (
          <AlertCircle size={20} />
        ) : isRecording ? (
          <Mic size={20} />
        ) : (
          <MicOff size={20} />
        )}
      </button>

      {showTranscript && transcript && (
        <div className="transcript-toast">
          <p className="transcript-text">{transcript}</p>
        </div>
      )}

      {error && <div className="error-toast">{error}</div>}
    </div>
  );
}
