import { GoogleGenerativeAI } from "@google/generative-ai";
import Bottleneck from "bottleneck";

class GeminiService {
  constructor() {
    this.keys = [];
    this.currentKeyIndex = 0;
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Bottleneck logic: Only allow 2 requests per second
    this.limiter = new Bottleneck({
      minTime: 500, // 500ms between requests (2 req/s)
      maxConcurrent: 2,
    });

    this.initializeKeys();
  }

  initializeKeys() {
    // 1. Load keys from comma-separated GEMINI_API_KEYS if present
    let possibleKeys = [];
    if (process.env.GEMINI_API_KEYS) {
      possibleKeys = process.env.GEMINI_API_KEYS.split(",").map((k) => k.trim());
    }

    // 2. Load explicitly numbered keys from .env and combine
    const numberedKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ];

    possibleKeys = [...possibleKeys, ...numberedKeys];

    // Filter out undefined or empty values, or default placeholder strings
    this.keys = possibleKeys.filter(
      (key) => key && key.trim() !== "" && !key.includes("your")
    );

    if (this.keys.length === 0) {
      console.warn("⚠️ No valid Gemini API keys found. Agent chat will fail.");
    }
  }

  getCurrentKey() {
    return this.keys[this.currentKeyIndex];
  }

  rotateKey() {
    console.warn(
      `🔄 Rotating API Key... (Index ${this.currentKeyIndex} exhausted)`
    );
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
    console.warn(`✅ Switched to Key Index ${this.currentKeyIndex}`);
  }

  async executeWithRotation(operation) {
    if (this.keys.length === 0) {
      throw new Error("No Gemini API keys configured.");
    }

    const MAX_RETRIES = this.keys.length; // Try at most the number of keys we have
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      try {
        // Instantiate the client with the CURRENT key
        const genAI = new GoogleGenerativeAI(this.getCurrentKey());

        // Wrap the passed operation in Bottleneck limiter
        return await this.limiter.schedule(async () => {
          return await operation(genAI);
        });
      } catch (error) {
        // Check if error is related to quota or rate limit (429)
        const isQuotaError =
          error.message?.includes("429") ||
          error.message?.includes("Too Many Requests") ||
          error.message?.includes("quota");

        if (isQuotaError && this.keys.length > 1) {
          console.error(`Gemini API Error (429/Quota): ${error.message}`);
          this.rotateKey();
          attempts++;
        } else {
          // If it's a structural error (e.g., bad format prompt) or we only have 1 key, throw
          throw error;
        }
      }
    }

    throw new Error(
      "All Gemini API keys are currently exhausted or experiencing rate limits."
    );
  }
}

export const geminiService = new GeminiService();
