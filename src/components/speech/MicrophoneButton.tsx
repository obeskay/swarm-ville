import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import "./MicrophoneButton.css";

export default function MicrophoneButton() {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement STT logic
  };

  return (
    <button
      onClick={toggleRecording}
      className={`microphone-btn ${isRecording ? "recording" : ""}`}
      title={isRecording ? "Stop recording" : "Start recording (Ctrl+Space)"}
    >
      {isRecording ? <Mic size={20} /> : <MicOff size={20} />}
    </button>
  );
}
