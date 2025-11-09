import { Router } from "express";

import { InMemorySessionRepository } from "./session.repository.js";
import { SessionService } from "./session.service.js";
import { SessionController } from "./session.controller.js";

const sessionRepository = new InMemorySessionRepository();
const sessionService = new SessionService(sessionRepository);
const sessionController = new SessionController(sessionService);

export const sessionRouter = Router();

sessionRouter.post("/iniciar", sessionController.iniciarSesion);

