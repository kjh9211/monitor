import { Router } from "express";
import type { IngestBatch } from "@monitor/shared";
import { prisma } from "../../db/prisma";
import { setLatestSnapshot } from "../../redis/client";
import { requireWriteToken, type AuthedRequest } from "../middleware/auth";

export const ingestRouter = Router();

function isValidBatch(body: unknown): body is IngestBatch {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const system = b.system as Record<string, unknown> | undefined;
  return (
    typeof b.timestamp === "number" &&
    !!system &&
    typeof system.cpuPercent === "number" &&
    typeof system.memoryPercent === "number" &&
    typeof system.diskPercent === "number" &&
    typeof system.uptimeSec === "number"
  );
}

ingestRouter.post("/v1/ingest", requireWriteToken, async (req: AuthedRequest, res) => {
  if (!isValidBatch(req.body)) {
    res.status(400).json({ error: "invalid ingest payload" });
    return;
  }

  const serverId = req.serverId!;
  await setLatestSnapshot(serverId, req.body);
  await prisma.server.update({
    where: { id: serverId },
    data: { lastSeenAt: new Date() },
  });

  res.status(202).end();
});
