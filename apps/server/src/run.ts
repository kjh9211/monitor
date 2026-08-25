import path from "node:path";
import { App } from "@kjh9211/autoupdate";

/** apps/server/dist에서 실행되므로, 모노레포 루트(git 저장소 루트)는 세 단계 위. */
const repoRoot = path.resolve(__dirname, "..", "..", "..");

const app = new App({
  cwd: repoRoot,
  branch: "main",
  startScript: "pnpm --filter @monitor/server start",
  onUpdate: (commitMessages, restartAt) => {
    console.log(`[autoupdate] 새 커밋 발견 — ${restartAt.toLocaleTimeString()}에 재시작 예정:`);
    for (const message of commitMessages) console.log(`  - ${message}`);
  },
});

app.start();
