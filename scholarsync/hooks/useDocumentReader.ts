import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";
import { useCallback } from "react";
import type { Attachment } from "../types/chat";
import { generateId } from "../utils/ids";

/**
 * Hook for picking documents and extracting their text content.
 *
 * - Plain text files (.txt, .md, .csv) → content read directly via FileSystem.
 * - PDF / Word → content included as filename label only (binary extraction
 *   requires a native lib; marked with a clear UI indicator).
 *
 * Returns a function that resolves with an Attachment (including textContent
 * when extractable).
 */
export function useDocumentReader() {
  const pickDocument = useCallback(async (): Promise<Attachment | null> => {
    let result: DocumentPicker.DocumentPickerResult | null = null;

    try {
      result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/plain",
          "text/markdown",
          "text/csv",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });
    } catch {
      Alert.alert("Error", "Could not open the file picker.");
      return null;
    }

    if (!result || result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    const name = asset.name ?? `file_${Date.now()}`;
    const mimeType = asset.mimeType ?? "";
    const uri = asset.uri;

    // For plain-text files, read the content so Claude can see it
    const isPlainText =
      mimeType.startsWith("text/") ||
      name.endsWith(".txt") ||
      name.endsWith(".md") ||
      name.endsWith(".csv");

    let textContent: string | undefined;

    if (isPlainText && uri) {
      try {
        const raw = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        // Cap at 6000 chars to stay within token budget
        textContent = raw.length > 6000 ? raw.slice(0, 6000) + "\n…[truncated]" : raw;
      } catch {
        // If reading fails, treat it as binary (no text extraction)
        textContent = undefined;
      }
    }

    return {
      id: generateId(),
      name,
      type: "document",
      textContent,
    };
  }, []);

  return { pickDocument };
}
