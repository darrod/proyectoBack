import type { Session } from "./session.types.js";

export interface SessionRepository {
  create(session: Session): Promise<Session>;
}

export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions = new Map<string, Session>();

  async create(session: Session): Promise<Session> {
    this.sessions.set(session.id, session);
    return session;
  }
}

