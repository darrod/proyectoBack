import type { ErrorRequestHandler } from "express";
import { logger } from "@config/logger.js";
import { HttpError } from "@shared/http/http-error.js";
import { HttpStatus } from "@shared/http/http-status.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const isHttpError = error instanceof HttpError;
  const statusCode = isHttpError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
  const message = isHttpError ? error.message : "Ha ocurrido un error inesperado.";
  const details = isHttpError ? error.details : undefined;

  logger.error(
    {
      err: error,
      path: req.path,
      method: req.method,
      requestId: req.id
    },
    error.message
  );

  return res.status(statusCode).json({
    status: "error",
    message,
    details
  });
};

