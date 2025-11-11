/**
 * Morse Code Visualizer
 * Beautiful minimalist morse code display with animations
 */

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Radio, Volume2, VolumeX } from "lucide-react";

interface MorseVisualizerProps {
  className?: string;
  initialText?: string;
}

// Morse code mapping
const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', ' ': '/'
};

const textToMorse = (text: string): string => {
  return text
    .toUpperCase()
    .split('')
    .map(char => MORSE_CODE[char] || '')
    .filter(code => code)
    .join(' ');
};

export function MorseVisualizer({ className = "", initialText = "" }: MorseVisualizerProps) {
  const [inputText, setInputText] = useState(initialText);
  const [morseCode, setMorseCode] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    if (inputText) {
      setMorseCode(textToMorse(inputText));
    } else {
      setMorseCode("");
    }
  }, [inputText]);

  const playMorse = () => {
    if (!morseCode) return;

    setIsPlaying(true);
    const symbols = morseCode.split('');
    let index = 0;

    const interval = setInterval(() => {
      if (index >= symbols.length) {
        clearInterval(interval);
        setIsPlaying(false);
        setCurrentIndex(-1);
        return;
      }

      setCurrentIndex(index);

      // Could add actual sound here if needed
      if (isSoundEnabled) {
        // Placeholder for sound implementation
      }

      index++;
    }, 300); // 300ms per symbol
  };

  const renderMorseSymbols = () => {
    if (!morseCode) return null;

    const symbols = morseCode.split('');

    return (
      <div className="flex flex-wrap gap-2 justify-center items-center min-h-[80px]">
        {symbols.map((symbol, idx) => {
          const isActive = isPlaying && idx === currentIndex;
          const isPast = isPlaying && idx < currentIndex;

          if (symbol === ' ') {
            return <div key={idx} className="w-2" />;
          }

          if (symbol === '/') {
            return <div key={idx} className="w-6" />;
          }

          return (
            <div
              key={idx}
              className={`
                transition-all duration-200
                ${symbol === '.' ? 'w-2 h-2' : 'w-6 h-2'}
                rounded-full
                ${isActive
                  ? 'bg-foreground scale-125 shadow-soft-lg'
                  : isPast
                    ? 'bg-foreground/40'
                    : 'bg-foreground/60'
                }
              `}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Card
      variant="elevated"
      padding="lg"
      className={`overflow-hidden ${className}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Radio className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Morse Code</h3>
              <p className="text-xs text-foreground/70">Visual translator</p>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          >
            {isSoundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Text to Convert</label>
          <Input
            placeholder="Type something..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="text-base"
          />
        </div>

        {/* Morse Display */}
        {morseCode && (
          <div className="p-6 rounded-[calc(var(--radius)*0.75)] bg-gradient-to-br from-foreground/5 to-foreground/10 border-2 border-foreground/10">
            {renderMorseSymbols()}
          </div>
        )}

        {/* Morse Text Representation */}
        {morseCode && (
          <div className="p-4 rounded-[calc(var(--radius)*0.66)] bg-background/50">
            <div className="text-xs text-foreground/70 mb-2">Morse Code:</div>
            <div className="font-mono text-sm break-all">{morseCode}</div>
          </div>
        )}

        {/* Controls */}
        {morseCode && (
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={playMorse}
              disabled={isPlaying}
              className="flex-1"
            >
              <Radio className="w-4 h-4 mr-2" />
              {isPlaying ? "Playing..." : "Play Morse"}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setInputText("");
                setMorseCode("");
                setCurrentIndex(-1);
                setIsPlaying(false);
              }}
              disabled={isPlaying}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="p-3 rounded-[calc(var(--radius)*0.5)] bg-primary/5 border border-primary/10">
          <p className="text-xs text-foreground/70">
            Dots (•) are short signals, dashes (—) are long signals.
            Spaces separate letters, slashes separate words.
          </p>
        </div>
      </div>
    </Card>
  );
}
