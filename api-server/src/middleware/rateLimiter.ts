import { rateLimit } from "express-rate-limit";

/**
 * Global rate limiter — 100 requests per minute per IP.
 * Applied to all API routes.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down.",
  },
});

/**
 * Strict rate limiter for the /api/chat route — 30 requests per minute per IP.
 * Keeps Claude API costs manageable and prevents abuse.
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Chat rate limit exceeded. Please wait a moment before sending more messages.",
  },
});
