import pino from "pino";
import { appEnv } from "./env.js";

const isProduction = appEnv.NODE_ENV === "production";

export const logger = pino({
  level: appEnv.LOG_LEVEL,
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: true,
          translateTime: "yyyy-mm-dd HH:MM:ss"
        }
      }
});

