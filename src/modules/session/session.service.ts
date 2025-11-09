import { randomUUID } from "node:crypto";

import type { CreateSessionDto, Session } from "./session.types.js";
import type { SessionRepository } from "./session.repository.js";

export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async createSession(payload: CreateSessionDto): Promise<Session> {
    const now = new Date().toISOString();

    const session: Session = {
      id: randomUUID(),
      usuarioId: payload.usuarioId,
      esInvitado: !payload.usuarioId,
      intereses: payload.intereses,
      fechaInicio: payload.fechaInicio.toISOString(),
      fechaFin: payload.fechaFin.toISOString(),
      tipoExperiencia: payload.tipoExperiencia,
      numeroViajeros: payload.numeroViajeros,
      restricciones: payload.restricciones,
      estado: "planificacion",
      createdAt: now,
      updatedAt: now
    };

    return this.sessionRepository.create(session);
  }
}

