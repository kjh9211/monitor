import type { IngestBatch } from "@monitor/shared";

export interface TransportOptions {
  token: string;
  apiUrl: string;
}

/**
 * 호스트 애플리케이션은 절대 이 함수 때문에 죽으면 안 된다.
 * 네트워크 실패, 서버 다운 등은 조용히 무시하고 다음 flush 주기에 다시 시도한다.
 */
export async function sendBatch(options: TransportOptions, batch: IngestBatch): Promise<void> {
  try {
    await fetch(`${options.apiUrl}/v1/ingest`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${options.token}`,
      },
      body: JSON.stringify(batch),
    });
  } catch {
    // 전송 실패는 무시한다.
  }
}
