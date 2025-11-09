import request from "supertest";

import { createApp } from "@/app.js";

describe("POST /api/sesion/iniciar", () => {
  it("crea una nueva sesión de planificación para un invitado", async () => {
    const app = createApp();

    const payload = {
      intereses: ["aventura", "gastronomia"],
      fechaInicio: "2025-12-10",
      fechaFin: "2025-12-20",
      tipoExperiencia: "Aventura Andina",
      numeroViajeros: 2,
      restricciones: ["vegetariano"]
    };

    const response = await request(app)
      .post("/api/sesion/iniciar")
      .send(payload)
      .expect(201);

    expect(response.body).toMatchObject({
      status: "success",
      data: {
        session: {
          esInvitado: true,
          intereses: payload.intereses,
          tipoExperiencia: payload.tipoExperiencia,
          numeroViajeros: payload.numeroViajeros,
          restricciones: payload.restricciones,
          estado: "planificacion"
        }
      }
    });

    expect(response.body.data.session.id).toBeDefined();
    expect(response.body.data.session.createdAt).toBeDefined();
  });

  it("valida que la fecha de fin no sea anterior a la fecha de inicio", async () => {
    const app = createApp();

    const payload = {
      intereses: ["aventura"],
      fechaInicio: "2025-12-20",
      fechaFin: "2025-12-10",
      tipoExperiencia: "Aventura Andina",
      numeroViajeros: 2,
      restricciones: []
    };

    const response = await request(app)
      .post("/api/sesion/iniciar")
      .send(payload)
      .expect(400);

    expect(response.body).toMatchObject({
      status: "error",
      message: "Los datos proporcionados no son válidos"
    });
    expect(response.body.details?.fechaFin?.[0]).toBe(
      "La fecha de fin debe ser posterior o igual a la fecha de inicio"
    );
  });
});

