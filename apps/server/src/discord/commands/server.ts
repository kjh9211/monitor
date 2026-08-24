import { randomBytes } from "node:crypto";
import { SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { IngestBatch } from "@monitor/shared";
import { prisma } from "../../db/prisma";
import { DEFAULT_ALERT_RULES } from "../../alerting/defaultRules";
import { getLatestSnapshot } from "../../redis/client";
import { buildStatusEmbed } from "../embeds/statusEmbed";
import { updateStatusEmbed } from "../services/embedUpdater";
import { enLocalization, messages, resolveLocale } from "../../i18n";
import type { Command } from "./types";

function generateWriteToken(): string {
  return `srv_${randomBytes(24).toString("hex")}`;
}

async function handleStatus(interaction: ChatInputCommandInteraction): Promise<void> {
  const locale = resolveLocale(interaction.locale);
  const name = interaction.options.getString("name");
  const server = await prisma.server.findFirst({
    where: { discordChannelId: interaction.channelId, ...(name ? { name } : {}) },
  });

  if (!server) {
    await interaction.reply({
      content: name ? messages[locale].statusNotFoundNamed(name) : messages[locale].statusNotFound(),
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const snapshot = await getLatestSnapshot<IngestBatch>(server.id);
  await updateStatusEmbed(
    { name: server.name, status: server.status, discordChannelId: server.discordChannelId, statusMessageId: server.statusMessageId },
    snapshot
  );

  if (!snapshot) {
    await interaction.editReply(messages[locale].statusNoData());
    return;
  }

  const secAgo = Math.max(0, Math.round((Date.now() - snapshot.timestamp) / 1000));
  await interaction.editReply(
    messages[locale].statusRefreshed(
      server.name,
      secAgo,
      snapshot.system.cpuPercent,
      snapshot.system.memoryPercent,
      snapshot.system.diskPercent
    )
  );
}

export const serverCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("모니터링 대상 서버를 관리합니다")
    .setDescriptionLocalizations(enLocalization("Manage monitored servers"))
    .addSubcommand((sub) =>
      sub
        .setName("register")
        .setDescription("현재 채널에 새 서버를 등록합니다")
        .setDescriptionLocalizations(enLocalization("Register a new server in this channel"))
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("서버 이름")
            .setDescriptionLocalizations(enLocalization("Server name"))
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("project")
            .setDescription("프로젝트 ID")
            .setDescriptionLocalizations(enLocalization("Project ID"))
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("등록된 서버의 최신 상태를 즉시 확인합니다 (주기 갱신을 기다리지 않음)")
        .setDescriptionLocalizations(
          enLocalization("Immediately check a registered server's latest status (without waiting for the periodic refresh)")
        )
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("서버 이름 (한 채널에 여러 서버가 있을 때만 필요)")
            .setDescriptionLocalizations(enLocalization("Server name (only needed if this channel has more than one)"))
            .setRequired(false)
        )
    ) as SlashCommandBuilder,

  async execute(interaction) {
    const locale = resolveLocale(interaction.locale);

    if (!interaction.inGuild() || !interaction.guildId || !interaction.channel?.isTextBased()) {
      await interaction.reply({ content: messages[locale].guildOnlyTextChannel(), ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();
    if (sub === "status") {
      await handleStatus(interaction);
      return;
    }
    if (sub !== "register") return;

    const name = interaction.options.getString("name", true);
    const projectId = interaction.options.getString("project", true);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.discordGuildId !== interaction.guildId) {
      await interaction.reply({ content: messages[locale].invalidProject(), ephemeral: true });
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
      embeds: [buildStatusEmbed({ name: server.name, status: server.status }, null, resolveLocale(interaction.guildLocale))],
    });

    await prisma.server.update({
      where: { id: server.id },
      data: { statusMessageId: message.id },
    });

    await interaction.reply({
      content: messages[locale].serverRegistered(name, writeToken),
      ephemeral: true,
    });
  },
};
