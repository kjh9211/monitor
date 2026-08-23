import type { AlertMetric, AlertOperator, IngestBatch } from "@monitor/shared";
import type { AlertRule } from "../../prisma/generated";
import { alertStateKey, redis } from "../redis/client";

function metricValue(metric: AlertMetric, snapshot: IngestBatch): number | null {
  switch (metric) {
    case "cpu":
      return snapshot.system.cpuPercent;
    case "memory":
      return snapshot.system.memoryPercent;
    case "disk":
      return snapshot.system.diskPercent;
    case "httpLatency":
      return snapshot.http?.avgLatencyMs ?? null;
    case "errorRate":
      return snapshot.http?.errorRate ?? null;
    default:
      return null;
  }
}

function breaches(value: number, operator: AlertOperator, threshold: number): boolean {
  return operator === "gt" ? value > threshold : value < threshold;
}

export interface EvaluationResult {
  firing: AlertRule[];
  resolved: AlertRule[];
}

/**
 * 각 규칙에 대해 임계값 + 지속시간 조건을 평가한다.
 * "지속 중" 상태는 Redis에 조건이 처음 참이 된 시각을 저장해서 추적한다.
 */
export async function evaluateRules(
  rules: AlertRule[],
  snapshot: IngestBatch,
  openIncidentMetrics: Set<string>
): Promise<EvaluationResult> {
  const firing: AlertRule[] = [];
  const resolved: AlertRule[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    const value = metricValue(rule.metric as AlertMetric, snapshot);
    const key = alertStateKey(rule.id);
    const alreadyOpen = openIncidentMetrics.has(rule.metric);
    const isBreaching = value !== null && breaches(value, rule.operator as AlertOperator, rule.threshold);

    if (isBreaching) {
      let since = await redis.get(key);
      if (!since) {
        since = Date.now().toString();
        await redis.set(key, since, "EX", 3600);
      }
      const elapsedSec = (Date.now() - Number(since)) / 1000;
      if (elapsedSec >= rule.durationSec && !alreadyOpen) {
        firing.push(rule);
      }
    } else {
      await redis.del(key);
      if (alreadyOpen) {
        resolved.push(rule);
      }
    }
  }

  return { firing, resolved };
}
