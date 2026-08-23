# @monitor/sdk-express

Discord 기반 서버 운영 Observability 플랫폼용 Express 미들웨어.

## 설치

```bash
npm install @monitor/sdk-express
```

## 사용법

```js
const express = require("express");
const monitor = require("@monitor/sdk-express").monitor;

const app = express();
app.use(monitor({ token: "srv_xxx" })); // Discord의 /server register 로 발급받은 토큰
```

`token`은 Discord 서버에서 `/server register` 명령을 실행하면 발급된다. 그 외 옵션은 모두 선택 사항이다.

```js
monitor({
  token: "srv_xxx",
  apiUrl: "https://your-monitor-api.example.com", // 자체 호스팅 시
  flushIntervalMs: 5000,
  diskPath: "/",
});
```

## 자동 수집 항목

- CPU / Memory / Disk / Uptime (5초 주기)
- HTTP 요청 latency, 5xx error rate (요청마다 누적 후 주기 전송)
- `uncaughtException` / `unhandledRejection`

전송 실패는 호스트 애플리케이션에 영향을 주지 않도록 항상 무시된다.
