import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/api/app";

describe("GET /healthz", () => {
  it("returns 200 ok", async () => {
    const res = await request(createApp()).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
