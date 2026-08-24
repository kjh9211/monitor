import { SlashCommandBuilder } from "discord.js";
import { prisma } from "../../db/prisma";
import { enLocalization, messages, resolveLocale } from "../../i18n";
import type { Command } from "./types";

export const projectCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("project")
    .setDescription("모니터링 프로젝트를 관리합니다")
    .setDescriptionLocalizations(enLocalization("Manage monitoring projects"))
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("새 프로젝트를 생성합니다")
        .setDescriptionLocalizations(enLocalization("Create a new project"))
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("프로젝트 이름")
            .setDescriptionLocalizations(enLocalization("Project name"))
            .setRequired(true)
        )
    ) as SlashCommandBuilder,

  async execute(interaction) {
    const locale = resolveLocale(interaction.locale);

    if (!interaction.inGuild() || !interaction.guildId) {
      await interaction.reply({ content: messages[locale].guildOnly(), ephemeral: true });
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
      content: messages[locale].projectCreated(project.id),
      ephemeral: true,
    });
  },
};
