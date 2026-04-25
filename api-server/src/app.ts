import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { globalLimiter } from "./middleware/rateLimiter";

// ── CORS origins ────────────────────────────────────────────────────────────
// Reads from ALLOWED_ORIGINS env var (comma-separated) or falls back to
// standard Expo / Metro dev-server localhost ports.
const rawOrigins = process.env.ALLOWED_ORIGINS;
const ALLOWED_ORIGINS: string[] = rawOrigins
  ? rawOrigins.split(",").map((o) => o.trim())
  : [
      "http://localhost:8081",
      "http://localhost:19000",
      "http://localhost:19006",
      "http://127.0.0.1:8081",
      "http://127.0.0.1:19000",
      "http://127.0.0.1:19006",
    ];

const app: Express = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── Request logging ──────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. native mobile, curl, tests)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      logger.warn({ origin }, "CORS rejected origin");
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);

export default app;

