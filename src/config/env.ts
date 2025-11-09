import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Variables de entorno inválidas:", parsedEnv.error.flatten().fieldErrors);
  throw new Error("La configuración de entorno es inválida.");
}

export const appEnv = parsedEnv.data;
export type AppEnv = typeof appEnv;

