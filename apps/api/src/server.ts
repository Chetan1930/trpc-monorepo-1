import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import rateLimit from "express-rate-limit";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env";

export const app = express();

// Rate limiting for public response submission
const responseLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { message: "Too many submissions. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/response/submit", responseLimiter);
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "FormFlow API",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

if (env.NODE_ENV !== "prod") {
  app.use(
    cors({
      origin: "*",
    }),
  );
}

app.use(express.json());

app.get("/", (req, res) => {
  return res.json({ message: "FormFlow API is running" });
});

app.get("/health", (req, res) => {
  return res.json({ message: "FormFlow server is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
