import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { logger } from "@repo/logger";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env";

export const app = express();

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === "prod" ? undefined : false, // relax CSP in dev for Scalar docs
    crossOriginEmbedderPolicy: false,
  }),
);

// ─── Compression ─────────────────────────────────────────────────────────────
app.use(compression());

// ─── Trust Proxy (for correct IP behind load balancers / nginx) ──────────────
app.set("trust proxy", 1);

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins =
  env.NODE_ENV === "prod"
    ? env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : ["*"];

app.use(
  cors({
    origin: allowedOrigins.includes("*")
      ? "*"
      : (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS blocked: ${origin}`));
          }
        },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ─── Request Logging ─────────────────────────────────────────────────────────
const morganStream = {
  write: (message: string) => logger.info(message.trim()),
};
app.use(morgan(env.NODE_ENV === "prod" ? "combined" : "dev", { stream: morganStream }));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// Stricter rate limit for form response submission
const responseLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // 10 submissions per minute per IP
  message: { message: "Too many submissions. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/response/submit", responseLimiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per 15 min
  message: { message: "Too many auth attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ─── OpenAPI Document ────────────────────────────────────────────────────────
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "FormFlow API",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  return res.json({
    name: "FormFlow API",
    version: "1.0.0",
    status: "running",
    docs: `${env.BASE_URL}/docs`,
  });
});

app.get("/health", async (_req, res) => {
  try {
    // Quick DB connectivity check
    const { db } = await import("@repo/database");
    const { sql } = await import("@repo/database");
    await db.execute(sql`SELECT 1`);
    return res.json({ status: "healthy", db: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error("Health check DB ping failed", { err });
    return res.status(503).json({ status: "unhealthy", db: "disconnected", timestamp: new Date().toISOString() });
  }
});

logger.debug(`OpenAPI JSON: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (_req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`API Docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

// OpenAPI REST adapter (used by the frontend apiFetch calls)
app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
    onError: ({ error, path }) => {
      logger.error(`OpenAPI error on path: ${path}`, { message: error.message });
    },
  }),
);

// Standard tRPC adapter (for tRPC React Query client)
app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
    onError: ({ error, path }) => {
      logger.error(`tRPC error on path: ${path}`, { message: error.message, code: error.code });
    },
  }),
);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("Unhandled error", { message: err.message, stack: err.stack });
  res.status(500).json({
    message: env.NODE_ENV === "prod" ? "Internal server error" : err.message,
  });
});

export default app;
