import { EmbedBuilder } from "discord.js";
import type { IngestBatch } from "@monitor/shared";
import { DEFAULT_LOCALE, messages, type AppLocale } from "../../i18n";

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
  snapshot: IngestBatch | null,
  locale: AppLocale = DEFAULT_LOCALE
): EmbedBuilder {
  const m = messages[locale];
  const embed = new EmbedBuilder()
    .setTitle(`${statusIcon(server.status)} ${server.name}`)
    .setColor(statusColor(server.status));

  if (!snapshot) {
    embed.setDescription(m.embedWaiting());
    return embed;
  }

  const { system, http } = snapshot;
  const systemLines = [
    `CPU      ${bar(system.cpuPercent)}  ${system.cpuPercent.toFixed(0)}%`,
    `Memory   ${bar(system.memoryPercent)}  ${system.memoryPercent.toFixed(0)}%`,
    `Disk     ${bar(system.diskPercent)}  ${system.diskPercent.toFixed(0)}%`,
  ];
  embed.addFields({ name: m.embedSystemField(), value: "```\n" + systemLines.join("\n") + "\n```" });

  if (http) {
    embed.addFields({
      name: m.embedHttpField(),
      value: m.embedHttpValue(http.avgLatencyMs, http.requestCount, http.errorRate * 100),
    });
  }

  const timeStr = new Date(snapshot.timestamp).toLocaleTimeString(locale === "ko" ? "ko-KR" : "en-US");
  embed.setFooter({ text: m.embedLastUpdate(timeStr) });
  return embed;
}
