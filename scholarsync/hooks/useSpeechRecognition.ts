import { Alert, Platform } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cross-platform speech recognition hook.
 * Uses the Web Speech API on web, and expo-speech-recognition on native.
 *
 * @param onResult  Called with the latest transcript as the user speaks.
 */
export function useSpeechRecognition(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognizerRef = useRef<any>(null);

  const start = useCallback(async () => {
    if (Platform.OS === "web") {
      const SR =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (!SR) {
        Alert.alert(
          "Not supported",
          "Speech recognition is not available in this browser.",
        );
        return;
      }
      const r = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.lang = "en-US";
      r.onresult = (e: any) => {
        const transcript = Array.from(e.results as any[])
          .map((res: any) => res[0].transcript)
          .join("");
        onResult(transcript);
      };
      r.onerror = () => setIsListening(false);
      r.onend = () => setIsListening(false);
      r.start();
      recognizerRef.current = r;
      setIsListening(true);
    } else {
      try {
        const ESR = await import("expo-speech-recognition");
        const { granted } = await (ESR as any).requestPermissionsAsync();
        if (!granted) {
          Alert.alert("Permission denied", "Microphone access required.");
          return;
        }
        await (ESR as any).startAsync({
          lang: "en-US",
          continuous: true,
          interimResults: true,
        });
        setIsListening(true);
      } catch {
        Alert.alert(
          "Unavailable",
          "Speech recognition requires a development build.",
        );
      }
    }
  }, [onResult]);

  const stop = useCallback(() => {
    if (Platform.OS === "web" && recognizerRef.current) {
      recognizerRef.current.stop();
      recognizerRef.current = null;
    } else {
      import("expo-speech-recognition")
        .then((m) => (m as any).stopAsync?.())
        .catch(() => {});
    }
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { if (isListening) stop(); }, []);

  return { isListening, start, stop };
}
