import type { AppLocale } from "./locale";

const ko = {
  guildOnly: () => "이 명령어는 서버(길드) 안에서만 사용할 수 있습니다.",
  guildOnlyTextChannel: () => "이 명령어는 서버(길드)의 텍스트 채널에서만 사용할 수 있습니다.",

  projectCreated: (projectId: string) =>
    [
      `✅ 프로젝트가 생성되었습니다.`,
      ``,
      `**Project ID**: \`${projectId}\``,
      `이제 이 채널에서 \`/server register\` 명령으로 서버를 등록하세요.`,
    ].join("\n"),

  invalidProject: () => "존재하지 않거나 이 서버(길드)에 속하지 않은 프로젝트입니다.",

  serverRegistered: (name: string, writeToken: string) =>
    [
      `✅ 서버가 등록되었습니다: **${name}**`,
      ``,
      `SDK에 아래 토큰을 설정하세요 (다시 조회할 수 없으니 안전한 곳에 보관하세요):`,
      `\`\`\`\n${writeToken}\n\`\`\``,
      ``,
      "```js",
      'const monitor = require("@kjh9211/sdk-express");',
      `app.use(monitor({ token: "${writeToken}" }));`,
      "```",
    ].join("\n"),

  statusNotFoundNamed: (name: string) => `이 채널에 등록된 \`${name}\` 서버를 찾을 수 없습니다.`,
  statusNotFound: () => "이 채널에 등록된 서버가 없습니다. `/server register`로 먼저 등록하세요.",
  statusNoData: () => "⚪ 아직 수신된 데이터가 없습니다. SDK 연동을 확인해주세요.",
  statusRefreshed: (name: string, secAgo: number, cpuPercent: number, memoryPercent: number, diskPercent: number) =>
    [
      `🔄 **${name}** 상태를 즉시 확인했습니다. (최근 수신: ${secAgo}초 전)`,
      `CPU ${cpuPercent.toFixed(0)}% · Memory ${memoryPercent.toFixed(0)}% · Disk ${diskPercent.toFixed(0)}%`,
    ].join("\n"),

  embedWaiting: () => "데이터 수신 대기 중...",
  embedSystemField: () => "System",
  embedHttpField: () => "HTTP",
  embedHttpValue: (avgLatencyMs: number, requestCount: number, errorRatePercent: number) =>
    `avg ${avgLatencyMs.toFixed(0)}ms · ${requestCount} req · error ${errorRatePercent.toFixed(1)}%`,
  embedLastUpdate: (timeStr: string) => `Last update: ${timeStr}`,

  incidentOpened: (serverName: string, metric: string, cause: string) =>
    [`🔴 **장애 발생** — ${serverName}`, `항목: ${metric}`, `원인: ${cause}`].join("\n"),
  incidentResolved: (serverName: string, metric: string, durationText: string) =>
    [`🟢 **장애 복구** — ${serverName}`, `항목: ${metric}`, `지속 시간: ${durationText}`].join("\n"),
  incidentDuration: (mins: number, secs: number) => `${mins}분 ${secs}초`,
};

type MessageDict = typeof ko;

const en: MessageDict = {
  guildOnly: () => "This command can only be used inside a server (guild).",
  guildOnlyTextChannel: () => "This command can only be used in a text channel of a server (guild).",

  projectCreated: (projectId: string) =>
    [
      `✅ Project created.`,
      ``,
      `**Project ID**: \`${projectId}\``,
      `Now run \`/server register\` in this channel to register a server.`,
    ].join("\n"),

  invalidProject: () => "This project doesn't exist or doesn't belong to this server (guild).",

  serverRegistered: (name: string, writeToken: string) =>
    [
      `✅ Server registered: **${name}**`,
      ``,
      `Set this token in your SDK (it can't be retrieved again, so store it safely):`,
      `\`\`\`\n${writeToken}\n\`\`\``,
      ``,
      "```js",
      'const monitor = require("@kjh9211/sdk-express");',
      `app.use(monitor({ token: "${writeToken}" }));`,
      "```",
    ].join("\n"),

  statusNotFoundNamed: (name: string) => `Couldn't find a server named \`${name}\` registered in this channel.`,
  statusNotFound: () => "No server is registered in this channel yet. Run `/server register` first.",
  statusNoData: () => "⚪ No data received yet. Check your SDK integration.",
  statusRefreshed: (name: string, secAgo: number, cpuPercent: number, memoryPercent: number, diskPercent: number) =>
    [
      `🔄 Refreshed **${name}**'s status. (last received ${secAgo}s ago)`,
      `CPU ${cpuPercent.toFixed(0)}% · Memory ${memoryPercent.toFixed(0)}% · Disk ${diskPercent.toFixed(0)}%`,
    ].join("\n"),

  embedWaiting: () => "Waiting for data...",
  embedSystemField: () => "System",
  embedHttpField: () => "HTTP",
  embedHttpValue: (avgLatencyMs: number, requestCount: number, errorRatePercent: number) =>
    `avg ${avgLatencyMs.toFixed(0)}ms · ${requestCount} req · error ${errorRatePercent.toFixed(1)}%`,
  embedLastUpdate: (timeStr: string) => `Last update: ${timeStr}`,

  incidentOpened: (serverName: string, metric: string, cause: string) =>
    [`🔴 **Incident opened** — ${serverName}`, `Metric: ${metric}`, `Cause: ${cause}`].join("\n"),
  incidentResolved: (serverName: string, metric: string, durationText: string) =>
    [`🟢 **Incident resolved** — ${serverName}`, `Metric: ${metric}`, `Duration: ${durationText}`].join("\n"),
  incidentDuration: (mins: number, secs: number) => `${mins}m ${secs}s`,
};

export const messages: Record<AppLocale, MessageDict> = { ko, en };
