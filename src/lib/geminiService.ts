import { parseAIJson } from "./utils";
import { UserAccount } from "@/types";
import { generateContextualAIResponse } from "./smartPedagogicalFallback";

type GoogleAuthListener = (resolve: (user: UserAccount) => void, reject: (err: Error) => void) => void;

let authModalListener: GoogleAuthListener | null = null;

export function registerGoogleAuthModalListener(listener: GoogleAuthListener | null) {
  authModalListener = listener;
}

export function getGoogleSessionUser(): UserAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("guruJagoan_currentUser");
    if (!raw) return null;
    const user: UserAccount = JSON.parse(raw);
    if (user && (user.isGoogleAuth || user.email)) {
      return user;
    }
    return null;
  } catch {
    return null;
  }
}

export function ensureGoogleLoginBeforeAI(): Promise<UserAccount> {
  return new Promise((resolve, reject) => {
    const existingGoogleUser = getGoogleSessionUser();
    if (existingGoogleUser) {
      resolve(existingGoogleUser);
      return;
    }
    if (authModalListener) {
      authModalListener(resolve, reject);
    } else {
      reject(new Error("Silakan login dan setujui akses dengan Akun Google terlebih dahulu untuk menggunakan fitur AI."));
    }
  });
}

export function getSavedApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("guruJagoan_apiKey") || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
}

export function setSavedApiKey(key: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("guruJagoan_apiKey", key.trim());
}

export function getSavedModel(): string {
  if (typeof window === "undefined") return "gemini-2.5-flash";
  return localStorage.getItem("guruJagoan_model") || "gemini-2.5-flash";
}

export function setSavedModel(model: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("guruJagoan_model", model);
}

export async function callGeminiAI(
  prompt: string,
  systemInstruction?: string,
  jsonMode = false
): Promise<string> {
  // Pastikan user sudah login & disetujui dengan akun Google
  const googleUser = await ensureGoogleLoginBeforeAI();

  const apiKey = getSavedApiKey();
  const model = getSavedModel();

  try {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        systemInstruction,
        jsonMode,
        apiKey,
        model,
        googleAccessToken: googleUser?.googleAccessToken || "",
        userEmail: googleUser?.email || "",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.text) {
        return data.text;
      }
    }
  } catch (err) {
    console.warn("Memulihkan koneksi AI lokal...", err);
  }

  return generateContextualAIResponse(prompt, systemInstruction || "", jsonMode);
}

export async function callGeminiJson<T = any>(
  prompt: string,
  systemInstruction?: string
): Promise<T> {
  const text = await callGeminiAI(prompt, systemInstruction, true);
  return parseAIJson(text, prompt, systemInstruction || "") as T;
}
