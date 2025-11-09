import http from "node:http";

import { createApp } from "./app.js";
import { appEnv } from "./config/env.js";
import { logger } from "./config/logger.js";

const app = createApp();
const server = http.createServer(app);

const port = appEnv.PORT;

server.listen(port, () => {
  logger.info(`🚀 Servidor escuchando en http://localhost:${port} (${appEnv.NODE_ENV})`);
});

const shutdownSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

shutdownSignals.forEach((signal) => {
  process.on(signal, () => {
    logger.info(`Recibida señal ${signal}, cerrando servidor...`);
    server.close((error) => {
      if (error) {
        logger.error({ err: error }, "Error al cerrar el servidor");
        process.exit(1);
      }
      logger.info("Servidor cerrado correctamente");
      process.exit(0);
    });
  });
});

