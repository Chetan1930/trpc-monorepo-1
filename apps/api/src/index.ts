import http from "node:http";
import { logger } from "@repo/logger";
import { app as expressApplication } from "./server";
import { env } from "./env";

let server: http.Server;

async function init() {
  try {
    server = http.createServer(expressApplication);

    server.listen(env.PORT, () => {
      logger.info(`🚀 FormFlow API running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`   Docs: ${env.BASE_URL}/docs`);
      logger.info(`   Health: ${env.BASE_URL}/health`);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        logger.error(`Port ${env.PORT} is already in use`);
      } else {
        logger.error("Server error", { err });
      }
      process.exit(1);
    });
  } catch (err) {
    logger.error("Failed to start HTTP server", { err });
    process.exit(1);
  }
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  if (!server) {
    process.exit(0);
    return;
  }

  server.close((err) => {
    if (err) {
      logger.error("Error during server close", { err });
      process.exit(1);
    } else {
      logger.info("Server closed successfully");
      process.exit(0);
    }
  });

  // Force exit after 10 seconds if server hasn't closed
  setTimeout(() => {
    logger.error("Forcing exit after 10s shutdown timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Catch unhandled rejections and exceptions
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Promise Rejection", { reason });
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { err });
  process.exit(1);
});

init();
