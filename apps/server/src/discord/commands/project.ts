import { SlashCommandBuilder } from "discord.js";
import { prisma } from "../../db/prisma";
import type { Command } from "./types";

export const projectCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("project")
    .setDescription("모니터링 프로젝트를 관리합니다")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("새 프로젝트를 생성합니다")
        .addStringOption((opt) => opt.setName("name").setDescription("프로젝트 이름").setRequired(true))
    ) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guildId) {
      await interaction.reply({ content: "이 명령어는 서버(길드) 안에서만 사용할 수 있습니다.", ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();
    if (sub !== "create") return;

    const name = interaction.options.getString("name", true);

    const project = await prisma.project.create({
      data: {
        name,
        ownerDiscordId: interaction.user.id,
        discordGuildId: interaction.guildId,
      },
    });

    await interaction.reply({
      content: [
        `✅ 프로젝트가 생성되었습니다.`,
        ``,
        `**Project ID**: \`${project.id}\``,
        `이제 이 채널에서 \`/server register\` 명령으로 서버를 등록하세요.`,
      ].join("\n"),
      ephemeral: true,
    });
  },
};
