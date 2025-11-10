import { useEffect, useState } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Alert } from "../ui/alert";
import { cn } from "@/lib/utils";

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
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
      <Button
        onClick={handleClick}
        size="icon"
        variant={error ? "destructive" : isRecording ? "default" : "outline"}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg transition-all",
          isRecording && "animate-pulse ring-4 ring-primary/50",
        )}
        title={
          isRecording
            ? "Stop recording (release)"
            : "Start recording (Ctrl+Space or click)"
        }
        disabled={!!error}
      >
        {error ? (
          <AlertCircle className="w-6 h-6" />
        ) : isRecording ? (
          <Mic className="w-6 h-6" />
        ) : (
          <MicOff className="w-6 h-6" />
        )}
      </Button>

      {showTranscript && transcript && (
        <Card className="max-w-xs animate-in slide-in-from-bottom-5">
          <CardContent className="p-3">
            <p className="text-sm">{transcript}</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="max-w-xs p-3">
          {error}
        </Alert>
      )}
    </div>
  );
}
