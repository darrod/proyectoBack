import pinoHttp from "pino-http";
import { appEnv } from "@config/env.js";
import { logger } from "@config/logger.js";

const healthEndpoints = new Set(["/health", "/ready", "/live"]);

export const requestLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => healthEndpoints.has(req.url ?? "")
  },
  customSuccessMessage: (req, res) => {
    const statusCode = res.statusCode;
    const method = req.method;
    const path = req.url;
    return `${method} ${path} -> ${statusCode}`;
  },
  customErrorMessage: (req, res, error) => {
    const method = req.method;
    const path = req.url;
    return `Error en ${method} ${path}: ${error.message}`;
  },
  customLogLevel: (req, res, error) => {
    if (error) return "error";
    if (res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return appEnv.NODE_ENV === "production" ? "info" : "debug";
  }
});

