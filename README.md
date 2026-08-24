# Discord 기반 서버 운영 Observability 플랫폼

[![CI](https://github.com/kjh9211/monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/kjh9211/monitor/actions/workflows/ci.yml)

> 📄 **[SDK ↔ Monitoring API 계약](./docs/api-contract.md)** — 새 언어 SDK를 만들거나 ingest 응답을 다룰 때 먼저 읽을 문서
> 📄 [기획서](./docs/기획서.md) — 제품 정의, 기능 범위, 로드맵

Discord를 개발자의 서버 운영 콘솔로 만든다. SDK를 앱에 한두 줄 추가하면 Discord 채널에서
서버 상태를 확인하고, 장애 알림을 받고, 장애 이력을 조회할 수 있다.

## 구조

```text
apps/server           Monitoring API + Discord Bot (Node.js/TypeScript, 단일 프로세스)
packages/shared        SDK <-> 서버가 공유하는 ingest 타입
docs/                   기획서, API 계약 문서
```

Express용 Node.js SDK(`@kjh9211/sdk-express`)는 [kjh9211/monitorSDK](https://github.com/kjh9211/monitorSDK)
레포로 분리되었다. SDK ↔ Core API 계약은 [`docs/api-contract.md`](./docs/api-contract.md)를 통해 동기화한다.

## 로컬 실행

### 1. 의존성 설치

```bash
pnpm install
```

### 2. Postgres / Redis 기동

```bash
docker compose up -d
```

### 3. 환경 변수

```bash
cp apps/server/.env.example apps/server/.env
```

`.env`에 Discord 애플리케이션의 `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`를 채운다.
봇 초대(OAuth2) URL은 아래 스코프/권한으로 생성한다.

- Scopes: `bot`, `applications.commands`
- Bot Permissions: `Send Messages`, `Embed Links`, `Read Message History`

### 4. DB 마이그레이션

```bash
pnpm --filter @monitor/server prisma:migrate
```

### 5. 서버 실행

```bash
pnpm dev
```

Discord에서 `/project create name:<이름>` → `/server register name:<이름> project:<Project ID>` 순으로
실행하면 해당 채널에 상태 임베드가 생성되고, 응답으로 SDK용 write token이 발급된다.

주기 갱신(기본 tick)을 기다리지 않고 최신 상태를 바로 보고 싶으면 `/server status`를 쓴다. 명령어 응답은
호출한 사용자의 Discord 클라이언트 언어(현재 한국어/영어 지원, `apps/server/src/i18n`)를 따르고, 채널에
게시되는 상태 임베드·장애 알림은 서버(길드)의 Discord 언어 설정을 따른다.

### 6. 앱에 SDK 연동

```bash
npm install @kjh9211/sdk-express
```

```js
const monitor = require("@kjh9211/sdk-express").monitor;
app.use(monitor({ token: "srv_xxx", apiUrl: "http://localhost:3000" }));
```

자세한 SDK 옵션은 [kjh9211/monitorSDK의 README](https://github.com/kjh9211/monitorSDK/blob/main/README.md) 참고.

## 빌드 / 타입체크 / 테스트

```bash
pnpm build
pnpm typecheck
pnpm test
```

`pnpm test`는 `apps/server`의 API 통합 테스트(`apps/server/tests`)를 실행한다. 실제 Postgres/Redis가 필요하므로
(4)번 단계까지 먼저 진행한 뒤 실행한다. CI(`.github/workflows/ci.yml`)에서도 동일한 순서로 매 PR마다 실행된다.

## 현재 구현 범위 (MVP)

- [x] Discord OAuth2 봇 설치, `/project create`, `/server register`, `/server status`(즉시 확인)
- [x] Discord 응답/임베드 i18n 기반 마련 (한국어/영어)
- [x] Node.js(Express) SDK: CPU/RAM/Disk/Uptime, HTTP latency/error rate, 에러 캡처
- [x] Discord 임베드 실시간 업데이트 (기존 메시지 수정 방식)
- [x] 임계값 + 지속시간 기반 알림, 장애 발생/복구 알림
- [ ] Spring Boot SDK, Python SDK
- [ ] DB/Redis 연동 모니터링, API 단위 metric
- [ ] CI/CD 연동, 장애 이력 조회 명령어(`/incidents`), 원격 명령

로드맵 전체는 [기획서](./docs/기획서.md) 9장을 참고.
