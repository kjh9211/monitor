import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { env } from "../config/env";
import { commands } from "./commands";

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function registerCommandsForGuild(guildId: string): Promise<void> {
  const rest = new REST().setToken(env.discordToken);
  await rest.put(Routes.applicationGuildCommands(env.discordClientId, guildId), {
    body: commands.map((c) => c.data.toJSON()),
  });
}

export async function startDiscordBot(): Promise<void> {
  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Discord bot ready as ${readyClient.user.tag}`);
    await Promise.all(readyClient.guilds.cache.map((guild) => registerCommandsForGuild(guild.id)));
  });

  client.on(Events.GuildCreate, (guild) => {
    registerCommandsForGuild(guild.id).catch((err) => console.error("슬래시 명령어 등록 실패:", err));
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find((c) => c.data.name === interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`명령어 처리 실패 (${interaction.commandName}):`, err);
      const payload = { content: "명령 실행 중 오류가 발생했습니다.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  });

  await client.login(env.discordToken);
}
