import { client } from "../client";

async function sendToChannel(channelId: string, content: string): Promise<void> {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased() || !("send" in channel)) return;
  await channel.send(content);
}

export async function notifyIncidentOpened(
  channelId: string,
  params: { serverName: string; metric: string; cause: string }
): Promise<void> {
  await sendToChannel(
    channelId,
    [`🔴 **장애 발생** — ${params.serverName}`, `항목: ${params.metric}`, `원인: ${params.cause}`].join("\n")
  );
}

export async function notifyIncidentResolved(
  channelId: string,
  params: { serverName: string; metric: string; durationSec: number }
): Promise<void> {
  const mins = Math.floor(params.durationSec / 60);
  const secs = Math.round(params.durationSec % 60);
  await sendToChannel(
    channelId,
    [`🟢 **장애 복구** — ${params.serverName}`, `항목: ${params.metric}`, `지속 시간: ${mins}분 ${secs}초`].join("\n")
  );
}
