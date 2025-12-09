import { env } from "./env";

export const isProd = env.NODE_ENV === "production";
export const isStaging = env.NODE_ENV === 'staging'