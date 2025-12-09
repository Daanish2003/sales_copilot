import express, { type Application } from "express";
import cors from "cors";
import "dotenv/config";
import compression from "compression";
import helmet from "helmet";
import HTTP_STATUS from "http-status";
import { z } from "zod";
import { env } from "./utils/env";
import { isProd } from "./utils/prod";
import { logger } from "./utils/logger";
import { asyncHandler, AppError, buildErrorResponse, toAppError } from "./utils/errors";
import { roomManager } from "./managers/room.manager";

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

let socketMetrics = {
  connectedClients: 0,
  totalConnections: 0,
  activeRooms: 0,
  messagesPerMinute: 0,
  lastMessageTime: null as Date | null,
  serverStartTime: new Date(),
};

const SIX = 6;
const ONE_DAY = 86_400;
const BYTE = 1024;
const THOUSAND = 1000;
const HUNDERED = 100;

export const updateSocketMetrics = (metrics: Partial<typeof socketMetrics>) => {
   socketMetrics = { ...socketMetrics, ...metrics };
}


export const allowedOrigins = [env.FRONTEND_URL, env.BACKEND_URL].filter(
  (origin): origin is string => Boolean(origin)
);

const app: Application = express();

if (isProd) {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "wss:", "ws:", allowedOrigins].flat(),
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: isProd ? SIX : 1,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: isProd ? ONE_DAY : 0,
  })
);

app.use(
  express.json({
    limit: "100kb",
    verify: (req, _, buf) => {
      (req as unknown as RawBodyRequest).rawBody = buf;
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "100kb",
  })
);

app.get("/health", (_, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

app.get("/socket-health", (_, res) => {
  const uptimeMinutes = Math.floor(process.uptime() / 60);

  const socketHealth = {
    success: true,
    message: "Socket.io server is healthy",
    timestamp: new Date().toISOString(),
    socket: {
      connectedClients: socketMetrics.connectedClients,
      totalConnections: socketMetrics.totalConnections,
      activeRooms: socketMetrics.activeRooms,
      messagesPerMinute: socketMetrics.messagesPerMinute,
      lastMessageTime: socketMetrics.lastMessageTime,
      serverUptime: `${uptimeMinutes} minutes`,
      isHealthy: socketMetrics.connectedClients >= 0, 
    },
  };

  const statusCode = socketHealth.socket.isHealthy
    ? HTTP_STATUS.OK
    : HTTP_STATUS.SERVICE_UNAVAILABLE;
  res.status(statusCode).json(socketHealth);
});

const roomSchema = z.object({
  roomId: z.string().min(1),
  userId: z.string().min(1),
});

app.post(
  "/room",
  asyncHandler(async (req, res) => {
    const parsed = roomSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid room payload", {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: "INVALID_ROOM_PAYLOAD",
        details: parsed.error.flatten(),
      });
    }

    const { roomId, userId } = parsed.data;
    await roomManager.createRoom(roomId, userId);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Room created successfully",
      timestamp: new Date().toISOString(),
    });
  })
);
if (isProd) {
  app.get("/metrics", (_, res) => {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics = {
      success: true,
      data: {
        system: {
          uptime: process.uptime(),
          memory: {
            rss: `${Math.round(usage.rss / BYTE / BYTE)} MB`,
            heapTotal: `${Math.round(usage.heapTotal / BYTE / BYTE)} MB`,
            heapUsed: `${Math.round(usage.heapUsed / BYTE / BYTE)} MB`,
            heapUsedPercentage: `${Math.round((usage.heapUsed / usage.heapTotal) * HUNDERED)}%`,
          },
          cpu: {
            user: `${Math.round(cpuUsage.user / THOUSAND)}ms`,
            system: `${Math.round(cpuUsage.system / THOUSAND)}ms`,
          },
          process: {
            pid: process.pid,
            version: process.version,
            platform: process.platform,
          },
        },

        socket: {
          connectedClients: socketMetrics.connectedClients,
          totalConnections: socketMetrics.totalConnections,
          activeRooms: socketMetrics.activeRooms,
          messagesPerMinute: socketMetrics.messagesPerMinute,
          lastMessageTime: socketMetrics.lastMessageTime,
          avgConnectionsPerMinute: Math.round(
            socketMetrics.totalConnections / (process.uptime() / 60)
          ),
          serverStartTime: socketMetrics.serverStartTime,
        },

        timestamp: new Date().toISOString(),
      },
    };

    res.status(HTTP_STATUS.OK).json(metrics);
  });
}

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const appError = toAppError(err, "Internal server error");

    logger.error("Express server error", {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      stack: appError.stack,
      url: req.url,
      method: req.method,
    });

    if (res.headersSent) {
      return next(appError);
    }

    const includeStack = !isProd;
    const payload = buildErrorResponse(
      appError,
      { includeStack }
    );

    if (isProd && !appError.isOperational) {
      payload.message = "Internal server error";
      delete payload.details;
      delete payload.stack;
    }

    res.status(appError.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR).json(payload);
  }
);

app.use("*splat", (_, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: "Endpoint not found",
    availableEndpoints: [
      "/health",
      "/socket-health",
      isProd ? "/metrics" : null,
    ].filter(Boolean),
    timestamp: new Date().toISOString(),
  });
});

export { app };