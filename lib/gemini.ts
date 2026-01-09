/**
 * Centralized Gemini model configuration.
 * Change this value to update the model across the entire application.
 * You can also override this by setting NEXT_PUBLIC_GEMINI_MODEL in your .env file.
 */
export const GEMINI_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-1.5-flash";
