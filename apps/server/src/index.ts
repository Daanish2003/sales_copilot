import { Server as IOServer, type DefaultEventsMap } from "socket.io";
import "dotenv/config";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { app } from "./app";
import { env } from "./utils/env";
import { logger } from "./utils/logger";
import { isProd } from "./utils/prod";
import { socketManager } from "./managers/socket.manager";

const port: number = env.PORT;
const httpServer: Server<typeof IncomingMessage, typeof ServerResponse> = createServer(app);

const io: IOServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = new IOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60_000,
  pingInterval: 25_000,
  allowEIO3: true,
});

(async () => {
  try {
    logger.info("✅ Redis clients connected successfully");

    socketManager.initialize(io);
    logger.info("✅ SocketManager initialized");

    httpServer.listen(port, "0.0.0.0", () => {
      logger.info(`🚀 Socket.IO server running on port ${port}`);
      if (!isProd) {
        logger.info(`👉 Listening at http://localhost:${port}`);
      }
    });
  } catch (error) {
    logger.error("❌ Failed to initialize server:", error);
    process.exit(1);
  }
})();

httpServer.on("error", (err) => {
  logger.error("❌ Server error:", err);
});

async function gracefulShutdown(signal: string):Promise<void> {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  try {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => (err ? reject(err) : resolve()));
    });
    logger.info("✅ HTTP server closed");

    io.close();
    logger.info("✅ Socket.IO closed");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error during graceful shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  logger.error("💥 Uncaught Exception:", error);
  setTimeout(() => process.exit(1), 2000);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  setTimeout(() => process.exit(1), 2000);
});