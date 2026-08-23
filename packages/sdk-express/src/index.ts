import type { RequestHandler } from "express";
import { collectSystemMetrics } from "./collectors/system";
import { HttpAggregator } from "./collectors/http";
import { ErrorCollector } from "./collectors/error";
import { sendBatch } from "./transport/client";
import type { MonitorOptions } from "./types";

const DEFAULT_API_URL = "https://api.monitor.example.com";
const DEFAULT_FLUSH_INTERVAL_MS = 5000;
const DEFAULT_DISK_PATH = process.platform === "win32" ? "C:" : "/";

/**
 * const monitor = require("@monitor/sdk-express");
 * app.use(monitor({ token: "srv_xxx" }));
 */
export function monitor(options: MonitorOptions): RequestHandler {
  if (!options?.token) {
    throw new Error("@monitor/sdk-express: token is required");
  }

  const apiUrl = options.apiUrl ?? DEFAULT_API_URL;
  const flushIntervalMs = options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
  const diskPath = options.diskPath ?? DEFAULT_DISK_PATH;

  const httpAggregator = new HttpAggregator();
  const errorCollector = new ErrorCollector();
  errorCollector.registerProcessHandlers();

  const timer = setInterval(() => {
    void collectSystemMetrics(diskPath).then((system) =>
      sendBatch(
        { token: options.token, apiUrl },
        {
          timestamp: Date.now(),
          system,
          http: httpAggregator.flush(),
          errors: errorCollector.flush(),
        }
      )
    );
  }, flushIntervalMs);
  timer.unref();

  return httpAggregator.middleware();
}

export type { MonitorOptions } from "./types";
