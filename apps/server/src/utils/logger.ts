import { createLoggerForService } from "@/config/log-config";
import { env } from "./env";
import { isProd, isStaging } from "./prod";


export const logger = createLoggerForService("webrtc", {
  betterStackHost: env.BETTER_STACK_HOST,
  betterStackToken: env.BETTER_STACK_TOKEN,
  enableBetterStack: !!(isProd || isStaging),
  enableConsole: true,
  enableFileLogging: !!(isProd || isStaging),
  level: env.LOG_LEVEL,
  nodeEnv: env.NODE_ENV,
  service: "webrtc",
  datePattern: "YYYY-MM-DD",
  logDir: "logs",
  maxFiles: "90d",
  maxSize: "20m",
  sampleRate: 1.0
})