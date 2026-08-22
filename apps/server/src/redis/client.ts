import Redis from "ioredis";
import { env } from "../config/env";

export const redis = new Redis(env.redisUrl);

const SNAPSHOT_TTL_SEC = 60;

export function latestSnapshotKey(serverId: string): string {
  return `server:${serverId}:latest`;
}

export function alertStateKey(ruleId: string): string {
  return `alert:${ruleId}:since`;
}

export async function setLatestSnapshot(serverId: string, snapshot: unknown): Promise<void> {
  await redis.set(latestSnapshotKey(serverId), JSON.stringify(snapshot), "EX", SNAPSHOT_TTL_SEC);
}

export async function getLatestSnapshot<T>(serverId: string): Promise<T | null> {
  const raw = await redis.get(latestSnapshotKey(serverId));
  return raw ? (JSON.parse(raw) as T) : null;
}
