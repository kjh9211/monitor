import type { AlertMetric, AlertOperator } from "@monitor/shared";

export interface DefaultAlertRule {
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  durationSec: number;
}
