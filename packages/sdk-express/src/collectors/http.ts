import type { RequestHandler } from "express";
import type { HttpAggregate } from "@monitor/shared";

/** flush 주기 동안의 HTTP 요청을 누적해서 평균 latency / error rate로 집계한다. */
export class HttpAggregator {
  private requestCount = 0;
  private totalLatencyMs = 0;
  private errorCount = 0;

  middleware(): RequestHandler {
    return (_req, res, next) => {
      const start = process.hrtime.bigint();
      res.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        this.requestCount += 1;
        this.totalLatencyMs += durationMs;
        if (res.statusCode >= 500) this.errorCount += 1;
      });
      next();
    };
  }

  flush(): HttpAggregate | undefined {
    if (this.requestCount === 0) return undefined;

    const aggregate: HttpAggregate = {
      requestCount: this.requestCount,
      avgLatencyMs: this.totalLatencyMs / this.requestCount,
      errorRate: this.errorCount / this.requestCount,
    };

    this.requestCount = 0;
    this.totalLatencyMs = 0;
    this.errorCount = 0;

    return aggregate;
  }
}
