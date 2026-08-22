import { env } from "./config/env";
import { createApp } from "./api/app";
import { startDiscordBot } from "./discord/client";
import { startScheduler } from "./scheduler/tick";

async function main() {
  await startDiscordBot();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Monitoring API listening on :${env.port}`);
  });

  startScheduler();
  console.log(`Scheduler running every ${env.tickIntervalSec}s`);
}

main().catch((err) => {
  console.error("서버 부팅 실패:", err);
  process.exit(1);
});
