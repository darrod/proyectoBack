import type { Express } from "express";
import { healthRouter } from "./public/health.routes.js";
import { sessionRouter } from "@modules/session/session.router.js";

export const registerRoutes = (app: Express): void => {
  app.use("/health", healthRouter);
  app.use("/api/sesion", sessionRouter);
};

