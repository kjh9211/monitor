import type { IngestBatch } from "@monitor/shared";
import { client } from "../client";
import { buildStatusEmbed } from "../embeds/statusEmbed";
import { resolveLocale } from "../../i18n";

export async function updateStatusEmbed(
  server: { name: string; status: string; discordChannelId: string; statusMessageId: string | null },
  snapshot: IngestBatch | null
): Promise<void> {
  if (!server.statusMessageId) return;

  const channel = await client.channels.fetch(server.discordChannelId).catch(() => null);
  if (!channel?.isTextBased() || !("messages" in channel)) return;

  const message = await channel.messages.fetch(server.statusMessageId).catch(() => null);
  if (!message) return;

  const guildLocale = "guild" in channel ? channel.guild?.preferredLocale : undefined;
  await message.edit({ embeds: [buildStatusEmbed(server, snapshot, resolveLocale(guildLocale))] });
}
