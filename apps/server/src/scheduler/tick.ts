import type { IngestBatch } from "@monitor/shared";
import type { AlertRule, Server } from "../../prisma/generated";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { getLatestSnapshot } from "../redis/client";
import { evaluateRules } from "../alerting/evaluator";
import { notifyIncidentOpened, notifyIncidentResolved } from "../discord/services/notifier";
import { updateStatusEmbed } from "../discord/services/embedUpdater";

type ServerWithRules = Server & { alertRules: AlertRule[] };

function causeText(metric: string, operator: string, threshold: number): string {
  return `${metric} ${operator === "gt" ? ">" : "<"} ${threshold}`;
}

async function tickServer(server: ServerWithRules): Promise<void> {
  const now = Date.now();
  const snapshot = await getLatestSnapshot<IngestBatch>(server.id);
  const isOnline = !!server.lastSeenAt && now - server.lastSeenAt.getTime() <= env.offlineThresholdSec * 1000;

  const openIncidents = await prisma.incident.findMany({
    where: { serverId: server.id, endedAt: null },
  });
  const openIncidentMetrics = new Set(openIncidents.map((i) => i.metric));

  let status = server.status;

  if (isOnline && status !== "ONLINE") {
    status = "ONLINE";
    await prisma.server.update({ where: { id: server.id }, data: { status } });

    const offlineIncident = openIncidents.find((i) => i.metric === "offline");
    if (offlineIncident) {
      const durationSec = (now - offlineIncident.startedAt.getTime()) / 1000;
      await prisma.incident.update({ where: { id: offlineIncident.id }, data: { endedAt: new Date() } });
      await notifyIncidentResolved(server.discordChannelId, {
        serverName: server.name,
        metric: "offline",
        durationSec,
      });
      openIncidentMetrics.delete("offline");
    }
  } else if (!isOnline && status !== "OFFLINE") {
    status = "OFFLINE";
    await prisma.server.update({ where: { id: server.id }, data: { status } });
    await prisma.incident.create({
      data: { serverId: server.id, metric: "offline", cause: "heartbeat timeout" },
    });
    await notifyIncidentOpened(server.discordChannelId, {
      serverName: server.name,
      metric: "offline",
      cause: `${env.offlineThresholdSec}초 이상 데이터 미수신`,
    });
    openIncidentMetrics.add("offline");
  }

  if (status === "ONLINE" && snapshot) {
    const { firing, resolved } = await evaluateRules(server.alertRules, snapshot, openIncidentMetrics);

    for (const rule of firing) {
      const cause = causeText(rule.metric, rule.operator, rule.threshold);
      await prisma.incident.create({
        data: { serverId: server.id, metric: rule.metric, cause },
      });
      await notifyIncidentOpened(server.discordChannelId, { serverName: server.name, metric: rule.metric, cause });
    }

    for (const rule of resolved) {
      const incident = openIncidents.find((i) => i.metric === rule.metric);
      if (!incident) continue;
      const durationSec = (now - incident.startedAt.getTime()) / 1000;
      await prisma.incident.update({ where: { id: incident.id }, data: { endedAt: new Date() } });
      await notifyIncidentResolved(server.discordChannelId, {
        serverName: server.name,
        metric: rule.metric,
        durationSec,
      });
    }
  }

  await updateStatusEmbed(
    { name: server.name, status, discordChannelId: server.discordChannelId, statusMessageId: server.statusMessageId },
    snapshot
  );
}

export function startScheduler(): void {
  setInterval(async () => {
    const servers = await prisma.server.findMany({ include: { alertRules: true } });
    await Promise.all(
      servers.map((server) => tickServer(server).catch((err) => console.error(`tick 실패 (${server.id}):`, err)))
    );
  }, env.tickIntervalSec * 1000);
}
