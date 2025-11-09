export type SessionStatus = "planificacion";

export interface CreateSessionDto {
  usuarioId?: string;
  intereses: string[];
  fechaInicio: Date;
  fechaFin: Date;
  tipoExperiencia: string;
  numeroViajeros: number;
  restricciones: string[];
}

export interface Session {
  id: string;
  usuarioId?: string;
  esInvitado: boolean;
  intereses: string[];
  fechaInicio: string;
  fechaFin: string;
  tipoExperiencia: string;
  numeroViajeros: number;
  restricciones: string[];
  estado: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

