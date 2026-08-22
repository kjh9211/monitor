import { EmbedBuilder } from "discord.js";
import type { IngestBatch } from "@monitor/shared";

function bar(percent: number): string {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const filled = Math.round(clamped / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function statusIcon(status: string): string {
  if (status === "ONLINE") return "🟢";
  if (status === "OFFLINE") return "🔴";
  return "⚪";
}

function statusColor(status: string): number {
  if (status === "ONLINE") return 0x2ecc71;
  if (status === "OFFLINE") return 0xe74c3c;
  return 0x95a5a6;
}

export function buildStatusEmbed(
  server: { name: string; status: string },
  snapshot: IngestBatch | null
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${statusIcon(server.status)} ${server.name}`)
    .setColor(statusColor(server.status));

  if (!snapshot) {
    embed.setDescription("데이터 수신 대기 중...");
    return embed;
  }

  const { system, http } = snapshot;
  const systemLines = [
    `CPU      ${bar(system.cpuPercent)}  ${system.cpuPercent.toFixed(0)}%`,
    `Memory   ${bar(system.memoryPercent)}  ${system.memoryPercent.toFixed(0)}%`,
    `Disk     ${bar(system.diskPercent)}  ${system.diskPercent.toFixed(0)}%`,
  ];
  embed.addFields({ name: "System", value: "```\n" + systemLines.join("\n") + "\n```" });

  if (http) {
    embed.addFields({
      name: "HTTP",
      value: `avg ${http.avgLatencyMs.toFixed(0)}ms · ${http.requestCount} req · error ${(http.errorRate * 100).toFixed(1)}%`,
    });
  }

  embed.setFooter({ text: `Last update: ${new Date(snapshot.timestamp).toLocaleTimeString()}` });
  return embed;
}
