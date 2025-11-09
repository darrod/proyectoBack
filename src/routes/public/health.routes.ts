import { Router } from "express";
import { appEnv } from "@config/env.js";
import { HttpStatus } from "@shared/http/http-status.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(HttpStatus.OK).json({
    status: "ok",
    environment: appEnv.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

