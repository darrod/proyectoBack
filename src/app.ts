import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { registerRoutes } from "./routes/index.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found-handler.js";
import { requestLogger } from "./middlewares/request-logger.js";

export const createApp = () => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

