export const GEMINI_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-flash-latest";

// List of models to try in order of preference
const MODEL_FALLBACK_LIST = [
  GEMINI_MODEL,
  "gemini-2.0-flash",
  "gemini-flash-latest"
];

/**
 * Gets a valid Gemini API key.
 * Implements simple rotation if multiple keys are configured.
 */
export function getGeminiApiKey(): string | undefined {
  if (typeof window !== "undefined") {
    const keys = [
      process.env.NEXT_PUBLIC_GEMINI_API_KEY_1,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY_2,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY
    ].filter(Boolean) as string[];

    if (keys.length === 0) return undefined;

    // Simple random selection to distribute load
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
  }
  
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY_1 || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
}

/**
 * Helper to get a working model.
 * If the primary model fails with a 404 or persistent 429 (limit 0), 
 * it can be used to switch to a fallback.
 */
export const getWorkingModel = (genAI: any, preferredModel?: string) => {
  // Currently, gemini-flash-latest is the only one confirmed working with these keys (limit > 0)
  const primary = preferredModel || GEMINI_MODEL;
  return genAI.getGenerativeModel({ model: primary });
};
