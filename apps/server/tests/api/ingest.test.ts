import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/api/app";
import { prisma } from "../../src/db/prisma";
import { getLatestSnapshot, redis } from "../../src/redis/client";

const app = createApp();

async function createTestServer(writeToken: string) {
  const project = await prisma.project.create({
    data: { name: "test-project", ownerDiscordId: "owner-1", discordGuildId: "guild-1" },
  });

  return prisma.server.create({
    data: {
      projectId: project.id,
      name: "test-server",
      writeToken,
      discordChannelId: "channel-1",
    },
  });
}

beforeEach(async () => {
  await prisma.incident.deleteMany();
  await prisma.alertRule.deleteMany();
  await prisma.server.deleteMany();
  await prisma.project.deleteMany();
  await redis.flushdb();
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});

describe("POST /v1/ingest", () => {
  it("rejects a request with no token", async () => {
    const res = await request(app).post("/v1/ingest").send({});
    expect(res.status).toBe(401);
  });

  it("rejects a request with an unknown token", async () => {
    const res = await request(app)
      .post("/v1/ingest")
      .set("authorization", "Bearer does-not-exist")
      .send({
        timestamp: Date.now(),
        system: { cpuPercent: 1, memoryPercent: 1, diskPercent: 1, uptimeSec: 1 },
      });
    expect(res.status).toBe(401);
  });

  it("rejects an invalid payload shape", async () => {
    const server = await createTestServer("srv_invalid_payload_test");

    const res = await request(app)
      .post("/v1/ingest")
      .set("authorization", `Bearer ${server.writeToken}`)
      .send({ foo: "bar" });

    expect(res.status).toBe(400);
  });

  it("accepts a valid batch, stores the snapshot in redis, and updates lastSeenAt", async () => {
    const server = await createTestServer("srv_valid_batch_test");

    const batch = {
      timestamp: Date.now(),
      system: { cpuPercent: 42.5, memoryPercent: 55.1, diskPercent: 30.2, uptimeSec: 120 },
      http: { requestCount: 10, avgLatencyMs: 24.3, errorRate: 0 },
    };

    const res = await request(app)
      .post("/v1/ingest")
      .set("authorization", `Bearer ${server.writeToken}`)
      .send(batch);

    expect(res.status).toBe(202);

    const snapshot = await getLatestSnapshot(server.id);
    expect(snapshot).toEqual(batch);

    const updated = await prisma.server.findUniqueOrThrow({ where: { id: server.id } });
    expect(updated.lastSeenAt).not.toBeNull();
  });
});
