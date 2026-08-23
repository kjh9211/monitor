/**
 * SDK <-> Monitoring API 사이의 ingest 데이터 계약.
 * 이 파일을 수정하면 apps/server와 packages/sdk-express 양쪽에 영향을 준다.
 */

export interface SystemMetrics {
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
  uptimeSec: number;
}

export interface HttpAggregate {
  requestCount: number;
  avgLatencyMs: number;
  /** 0~1 사이 비율. 5xx 응답 수 / 전체 요청 수 */
  errorRate: number;
}

export interface ErrorSample {
  message: string;
  stack?: string;
  timestamp: number;
}

export interface IngestBatch {
  timestamp: number;
  system: SystemMetrics;
  http?: HttpAggregate;
  errors?: ErrorSample[];
}

export type AlertMetric = "cpu" | "memory" | "disk" | "httpLatency" | "errorRate";
export type AlertOperator = "gt" | "lt";

export const INGEST_TOKEN_HEADER = "authorization";
