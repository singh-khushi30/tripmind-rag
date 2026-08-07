import "server-only";

import { GoogleGenAI } from "@google/genai";

import { getGeminiApiKey } from "@/lib/gemini/env";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({
      apiKey: getGeminiApiKey(),
    });
  }

  return client;
}
