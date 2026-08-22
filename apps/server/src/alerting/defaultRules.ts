import type { DefaultAlertRule } from "./types";

/** 서버 등록 시 자동으로 생성되는 기본 알림 규칙 (기획서 5.5 참고) */
export const DEFAULT_ALERT_RULES: DefaultAlertRule[] = [
  { metric: "cpu", operator: "gt", threshold: 80, durationSec: 300 },
  { metric: "memory", operator: "gt", threshold: 90, durationSec: 0 },
  { metric: "disk", operator: "gt", threshold: 85, durationSec: 0 },
  { metric: "httpLatency", operator: "gt", threshold: 500, durationSec: 0 },
  { metric: "errorRate", operator: "gt", threshold: 0.05, durationSec: 0 },
];
