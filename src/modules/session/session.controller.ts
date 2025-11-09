import type { RequestHandler } from "express";

import { HttpError } from "@shared/http/http-error.js";
import { HttpStatus } from "@shared/http/http-status.js";

import { createSessionSchema } from "./session.schema.js";
import type { SessionService } from "./session.service.js";

export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  iniciarSesion: RequestHandler = async (req, res, next) => {
    try {
      const parseResult = createSessionSchema.safeParse(req.body);

      if (!parseResult.success) {
        const formattedErrors = parseResult.error.flatten().fieldErrors;
        throw new HttpError(
          HttpStatus.BAD_REQUEST,
          "Los datos proporcionados no son válidos",
          formattedErrors
        );
      }

      const payload = parseResult.data;

      const session = await this.sessionService.createSession({
        usuarioId: payload.usuarioId,
        intereses: payload.intereses,
        fechaInicio: payload.fechaInicio,
        fechaFin: payload.fechaFin,
        tipoExperiencia: payload.tipoExperiencia,
        numeroViajeros: payload.numeroViajeros,
        restricciones: payload.restricciones
      });

      res.status(HttpStatus.CREATED).json({
        status: "success",
        data: {
          session
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

