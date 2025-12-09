import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "staging"]).default("development"),

  PORT: z.coerce.number(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"), 
  FRONTEND_URL: z.url(),
  BACKEND_URL: z.url(),
  CHAT_URL: z.url(),
  CLOUDFLARE_TURN_TOKEN: z.string().min(1),
  CLOUDFLARE_API_TOKEN: z.string().min(1),
  CLOUDFLARE_TURN_URL: z.string().min(1),
  WEBRTC_URL: z.url(),
  ALLOWED_APP_VERSION: z.string().min(1),
  REDIS_PASSWORD: z.string().min(1),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number(),
  BETTER_STACK_TOKEN: z.string().min(1),
  BETTER_STACK_HOST: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env);
