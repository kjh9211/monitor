import type { ErrorSample } from "@monitor/shared";

const MAX_SAMPLES = 20;

/** 프로세스 레벨에서 잡히지 않은 예외/거부를 수집한다 (Express 5 미만은 async 에러도 대부분 여기로 옴). */
export class ErrorCollector {
  private samples: ErrorSample[] = [];

  registerProcessHandlers(): void {
    process.on("uncaughtException", (err) => this.capture(err));
    process.on("unhandledRejection", (reason) => this.capture(reason));
  }

  private capture(err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;

    this.samples.push({ message, stack, timestamp: Date.now() });
    if (this.samples.length > MAX_SAMPLES) this.samples.shift();
  }

  flush(): ErrorSample[] | undefined {
    if (this.samples.length === 0) return undefined;
    const out = this.samples;
    this.samples = [];
    return out;
  }
}
