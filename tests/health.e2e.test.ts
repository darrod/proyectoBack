import request from "supertest";

import { createApp } from "@/app.js";

describe("GET /health", () => {
  it("debería responder con el estado OK", async () => {
    const app = createApp();

    const response = await request(app).get("/health").expect(200);

    expect(response.body).toMatchObject({
      status: "ok"
    });
  });
});

