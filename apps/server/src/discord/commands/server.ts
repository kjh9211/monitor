import { randomBytes } from "node:crypto";
import { SlashCommandBuilder } from "discord.js";
import { prisma } from "../../db/prisma";
import { DEFAULT_ALERT_RULES } from "../../alerting/defaultRules";
import { buildStatusEmbed } from "../embeds/statusEmbed";
import type { Command } from "./types";

function generateWriteToken(): string {
  return `srv_${randomBytes(24).toString("hex")}`;
}

export const serverCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("모니터링 대상 서버를 관리합니다")
    .addSubcommand((sub) =>
      sub
        .setName("register")
        .setDescription("현재 채널에 새 서버를 등록합니다")
        .addStringOption((opt) => opt.setName("name").setDescription("서버 이름").setRequired(true))
        .addStringOption((opt) => opt.setName("project").setDescription("프로젝트 ID").setRequired(true))
    ) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guildId || !interaction.channel?.isTextBased()) {
      await interaction.reply({ content: "이 명령어는 서버(길드)의 텍스트 채널에서만 사용할 수 있습니다.", ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();
    if (sub !== "register") return;

    const name = interaction.options.getString("name", true);
    const projectId = interaction.options.getString("project", true);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.discordGuildId !== interaction.guildId) {
      await interaction.reply({ content: "존재하지 않거나 이 서버(길드)에 속하지 않은 프로젝트입니다.", ephemeral: true });
      return;
    }

    const writeToken = generateWriteToken();

    const server = await prisma.server.create({
      data: {
        projectId: project.id,
        name,
        writeToken,
        discordChannelId: interaction.channelId,
        alertRules: {
          create: DEFAULT_ALERT_RULES,
        },
      },
    });

    const message = await interaction.channel.send({
      embeds: [buildStatusEmbed({ name: server.name, status: server.status }, null)],
    });

    await prisma.server.update({
      where: { id: server.id },
      data: { statusMessageId: message.id },
    });

    await interaction.reply({
      content: [
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
      ephemeral: true,
    });
  },
};
