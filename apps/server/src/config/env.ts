import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  redisUrl: required("REDIS_URL"),
  discordToken: required("DISCORD_TOKEN"),
  discordClientId: required("DISCORD_CLIENT_ID"),
  port: Number(process.env.PORT ?? 3000),
  offlineThresholdSec: Number(process.env.OFFLINE_THRESHOLD_SEC ?? 30),
  tickIntervalSec: Number(process.env.TICK_INTERVAL_SEC ?? 10),
};
