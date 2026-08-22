import os from "node:os";
import checkDiskSpace from "check-disk-space";
import type { SystemMetrics } from "@monitor/shared";

const startedAt = Date.now();

type CpuTimes = { user: number; nice: number; sys: number; idle: number; irq: number };

function cpuSnapshot(): CpuTimes[] {
  return os.cpus().map((cpu) => ({ ...cpu.times }));
}

function cpuUsagePercent(before: CpuTimes[], after: CpuTimes[]): number {
  let idleDelta = 0;
  let totalDelta = 0;

  for (let i = 0; i < after.length; i++) {
    const b = before[i];
    const a = after[i];
    const bTotal = b.user + b.nice + b.sys + b.idle + b.irq;
    const aTotal = a.user + a.nice + a.sys + a.idle + a.irq;
    totalDelta += aTotal - bTotal;
    idleDelta += a.idle - b.idle;
  }

  if (totalDelta <= 0) return 0;
  return Math.max(0, Math.min(100, (1 - idleDelta / totalDelta) * 100));
}

/** CPU는 짧은 간격(sampleMs)을 두고 두 번 샘플링해 사용률을 계산한다. */
export async function collectSystemMetrics(diskPath: string, sampleMs = 100): Promise<SystemMetrics> {
  const before = cpuSnapshot();
  await new Promise((resolve) => setTimeout(resolve, sampleMs));
  const after = cpuSnapshot();

  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  let diskPercent = 0;
  try {
    const disk = await checkDiskSpace(diskPath);
    diskPercent = ((disk.size - disk.free) / disk.size) * 100;
  } catch {
    // 디스크 경로를 읽을 수 없는 환경(권한/플랫폼 이슈)에서도 나머지 지표는 계속 수집한다.
  }

  return {
    cpuPercent: cpuUsagePercent(before, after),
    memoryPercent: ((totalMem - freeMem) / totalMem) * 100,
    diskPercent,
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
  };
}
