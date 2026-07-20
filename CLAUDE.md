# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Whipping Time은 프론트엔드 챕터(스터디 세션)의 주제 제안·투표 도구다. React SPA로, 별도 DB 없이 **GitHub Discussions GraphQL API를 데이터 저장소로**, GitHub OAuth를 인증으로 쓰고 GitHub Pages에 정적 배포된다. 상세 요구사항/설계는 `.kiro/specs/whipping-time/{requirements,design,tasks}.md`에 있음 — 기능을 바꾸기 전에 참고할 것.

## 커맨드

- `npm run dev` — 개발 서버 (Vite)
- `npm run build` — 타입체크(`tsc -b`) 후 프로덕션 빌드
- `npm run lint` — 타입 체크만 함(`tsc --noEmit`). ESLint 설정 없음 — 타입체크가 lint 역할을 대신함
- `npm test` — 전체 테스트 1회 실행 (vitest run)
- `npm run test:watch` — watch 모드
- 단일 테스트 파일: `npx vitest run src/utils/topic-utils.test.ts`
- 이름으로 특정 테스트만: `npx vitest run -t "<테스트 이름>"`
- `npm run preview` — 빌드 결과물 로컬 서빙

## 아키텍처

### 데이터 흐름 — DB 없이 GitHub가 백엔드

도메인 개념이 GitHub Discussions 개념에 매핑된다: Chapter ↔ Discussion Category, Topic ↔ Discussion, Vote ↔ 👍 Reaction. `src/utils/discussion-mapper.ts`가 이 변환/직렬화를 담당하며, Topic의 부가 메타데이터(type, 익명여부, assignee 등)는 Discussion body 안에 HTML 주석 JSON(`<!-- metadata:{...} -->`)으로 저장·파싱된다.

모든 GraphQL 호출은 `src/utils/graphql-client.ts`(`graphqlRequest`)를 거쳐 `https://api.github.com/graphql`을 직접 호출한다. `src/hooks/useGraphQL.ts`가 이를 감싸서 인증 토큰 부착, 401 시 자동 로그아웃, `mutate`는 미인증 시 즉시 에러를 던지는 처리를 한다. 즉 **읽기는 비로그인 허용, 쓰기(topic 생성/투표)는 로그인 필수**라는 규칙이 hook 레이어에서 강제된다 (`AuthGuard` 컴포넌트도 UI 레벨에서 같은 규칙을 적용).

### 인증 — client_secret은 별도 프록시로 분리

SPA에서는 GitHub OAuth의 client_secret을 직접 다룰 수 없어서, `oauth-proxy/`(별도 배포 단위인 Cloudflare Worker)가 Authorization Code → Access Token 교환을 대행한다. 토큰은 sessionStorage에만 저장되고(새로고침 시 GitHub `/user` API로 유효성 재검증, `src/contexts/AuthContext.tsx`), 로그인 흐름은 `/auth/callback` 라우트(`AuthCallbackPage`)가 code를 받아 프록시에 교환 요청 후 `AuthContext.setAuthData`를 호출하는 식으로 이어진다. `oauth-proxy/`는 프론트엔드 빌드/배포(`.github/workflows/deploy.yml`)와는 별개로 `wrangler deploy`로 따로 배포한다 (`oauth-proxy/README.md` 참고).

### GitHub Pages 특이사항

base path가 `/whipping-time/`으로 고정돼 있다(`vite.config.ts`). 라우트 경로를 직접 계산하는 코드(예: `AuthContext.login`의 returnPath 저장)는 이 prefix를 수동으로 떼어내고 있으니, 라우팅 관련 코드를 만질 때 이 prefix 처리를 놓치지 않아야 한다. 정적 호스팅이라 클라이언트 사이드 라우팅을 위한 404.html 폴백에 의존한다.

### 테스트 전략

일반 유닛/통합 테스트 외에 **fast-check 기반 property-based test**(`*.property.test.ts(x)` 파일들)가 핵심 로직(정렬, 유효성 검증, Discussion ↔ Topic 직렬화 라운드트립 등)에 쓰인다. 이 property들은 `.kiro/specs/whipping-time/design.md`의 "Correctness Properties" 13개 항목과 1:1 대응하므로, 관련 로직을 수정하면 그 문서의 property 설명도 여전히 성립하는지 확인한다. GitHub GraphQL 호출은 `src/mocks/handlers.ts` + `src/mocks/server.ts`(MSW)로 모킹하고, 접근성은 `vitest-axe`로 검증한다.

## 기타

- `temp-project/`는 앱과 무관한 별도 Vite 스캐폴드다 — 실제 앱 소스는 루트의 `src/`.
