import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { generateContextualAIResponse } from "./smartPedagogicalFallback";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseAIJson(text: string, fallbackPrompt = "", fallbackSystem = ""): any {
  if (text && typeof text === "object") return text;
  try {
    let cleanText = (text || "")
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const startObj = cleanText.indexOf("{");
    const endObj = cleanText.lastIndexOf("}");
    if (startObj >= 0 && endObj > startObj) {
      cleanText = cleanText.substring(startObj, endObj + 1);
    }
    cleanText = cleanText.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(cleanText);
  } catch (error) {
    console.warn("Memulihkan format JSON secara otomatis dengan Smart Pedagogical Engine...", error);
    const recovered = generateContextualAIResponse(fallbackPrompt, fallbackSystem, true);
    return JSON.parse(recovered);
  }
}
