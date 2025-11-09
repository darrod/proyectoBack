import type { RequestHandler } from "express";
import { HttpError } from "@shared/http/http-error.js";
import { HttpStatus } from "@shared/http/http-status.js";

export const notFoundHandler: RequestHandler = (req) => {
  throw new HttpError(HttpStatus.NOT_FOUND, `Recurso no encontrado: ${req.originalUrl}`);
};

