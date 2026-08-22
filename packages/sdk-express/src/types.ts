export interface MonitorOptions {
  /** /server register 명령으로 발급받은 write token */
  token: string;
  /** Monitoring API 주소 (기본값: 호스팅되는 서비스 엔드포인트) */
  apiUrl?: string;
  /** 메트릭 전송 주기 (ms). 기본 5000 */
  flushIntervalMs?: number;
  /** 디스크 사용량을 측정할 경로. 기본 "/" (Windows는 "C:") */
  diskPath?: string;
}
