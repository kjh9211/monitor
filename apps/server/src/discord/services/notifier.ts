import type { SendableChannels } from "discord.js";
import { client } from "../client";
import { messages, resolveLocale, type AppLocale } from "../../i18n";

async function resolveSendableChannel(
  channelId: string
): Promise<{ channel: SendableChannels; locale: AppLocale } | null> {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isSendable()) return null;
  const guildLocale = "guild" in channel ? channel.guild?.preferredLocale : undefined;
  return { channel, locale: resolveLocale(guildLocale) };
}

export async function notifyIncidentOpened(
  channelId: string,
  params: { serverName: string; metric: string; cause: string }
): Promise<void> {
  const target = await resolveSendableChannel(channelId);
  if (!target) return;
  await target.channel.send(messages[target.locale].incidentOpened(params.serverName, params.metric, params.cause));
}

export async function notifyIncidentResolved(
  channelId: string,
  params: { serverName: string; metric: string; durationSec: number }
): Promise<void> {
  const target = await resolveSendableChannel(channelId);
  if (!target) return;
  const mins = Math.floor(params.durationSec / 60);
  const secs = Math.round(params.durationSec % 60);
  const durationText = messages[target.locale].incidentDuration(mins, secs);
  await target.channel.send(messages[target.locale].incidentResolved(params.serverName, params.metric, durationText));
}
