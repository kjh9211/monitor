# SDK ↔ Monitoring API 계약

SDK(모든 언어 공통)와 Core API가 지켜야 하는 데이터 계약이다. TypeScript 타입 원본은
[`packages/shared/src/index.ts`](../packages/shared/src/index.ts)에 있으며, 이 문서는
그 계약을 언어 무관하게 정리한 것이다. 새 언어(Spring Boot, Python) SDK를 만들 때도
이 계약만 지키면 동일한 Core API/Discord Bot을 그대로 사용할 수 있다.

## 인증

- SDK 설정값은 `token` 하나뿐이다. 이 토큰은 **Server 하나에 1:1로 매핑**되며,
  Discord에서 `/server register` 명령을 실행할 때 발급된다 (Project ID를 SDK가 알 필요 없음).
- 모든 요청에 `Authorization: Bearer <token>` 헤더를 포함한다.
- 인증 실패 시 `401`을 반환한다.

## 엔드포인트

### `POST /v1/ingest`

SDK가 주기적으로(기본 5초) 메트릭을 배치로 전송한다.

**Headers**

| Header | 값 |
|---|---|
| `Authorization` | `Bearer <write token>` |
| `Content-Type` | `application/json` |

**Body**

```jsonc
{
  "timestamp": 1755900000000,     // epoch ms
  "system": {
    "cpuPercent": 48.2,           // 0~100
    "memoryPercent": 62.1,        // 0~100
    "diskPercent": 41.0,          // 0~100
    "uptimeSec": 3600
  },
  "http": {                       // 선택. 이번 flush 구간 동안 요청이 없었으면 생략
    "requestCount": 124,
    "avgLatencyMs": 24.3,
    "errorRate": 0.02             // 0~1, 5xx 비율
  },
  "errors": [                     // 선택. 캡처된 예외 샘플 (최대 20개까지 버퍼링)
    { "message": "TypeError: ...", "stack": "...", "timestamp": 1755899990000 }
  ]
}
```

**Response**

- `202 Accepted` — 정상 수신 (본문 없음)
- `400 Bad Request` — `system` 필드 누락 등 payload 형식 오류
- `401 Unauthorized` — 토큰 누락/무효

### `GET /healthz`

Core API 자체의 liveness probe. `{ "ok": true }`를 반환한다.

## 서버 온라인/오프라인 판정

Core API는 별도의 heartbeat 엔드포인트 없이, `/v1/ingest` 수신 시각(`lastSeenAt`)만으로
판단한다. `OFFLINE_THRESHOLD_SEC`(기본 30초) 동안 ingest가 없으면 해당 Server를
`OFFLINE`으로 전환하고 장애 알림을 보낸다. 즉, **SDK는 별도의 헬스체크 요청 없이 정상 동작 중
flush를 계속 보내는 것 자체가 헬스체크 역할을 한다.**

## SDK 구현 시 지켜야 할 규칙

1. 전송 실패는 절대 호스트 애플리케이션에 예외를 던지지 않는다 (조용히 무시하고 다음 주기에 재시도).
2. `system`은 매 배치마다 필수. `http`/`errors`는 수집된 것이 있을 때만 포함한다.
3. 값 단위는 항상 백분율(0~100)과 밀리초(ms)로 통일한다 (`errorRate`만 0~1 비율).
