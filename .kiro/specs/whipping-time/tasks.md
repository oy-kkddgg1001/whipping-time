# Implementation Plan: Whipping Time

## Overview

GitHub Discussions API 기반의 프론트엔드 챕터 주제 선정 도구를 React 18+ / TypeScript / Vite로 구현합니다. 핵심 인프라 설정 → 인증 → 데이터 모델/유틸 → 챕터 관리 → 주제 관리 → 투표 → UI/접근성 순서로 점진적으로 구현합니다.

## Tasks

- [x] 1. 프로젝트 초기 설정 및 인프라 구성
  - [x] 1.1 Vite + React + TypeScript 프로젝트 초기화 및 핵심 의존성 설치
    - Vite 프로젝트 생성 (react-ts 템플릿)
    - React Router v6, CSS Modules 설정
    - Vitest, React Testing Library, MSW, fast-check, axe-core 개발 의존성 설치
    - `vite.config.ts`에 base path `/whipping-time/` 설정
    - _Requirements: 7.1, 7.2_

  - [x] 1.2 디자인 토큰 및 글로벌 스타일 시스템 구성
    - CSS 변수 기반 디자인 토큰 정의 (색상, 타이포그래피, 간격)
    - 반응형 브레이크포인트 설정 (360px 모바일, 768px 데스크톱)
    - 글로벌 리셋 스타일 및 접근성 기본 스타일 (포커스 링 등)
    - _Requirements: 9.1, 9.2_

  - [x] 1.3 React Router 라우팅 구조 및 GitHub Pages SPA 폴백 설정
    - React Router v6 라우트 정의 (`/`, `/chapters/:id`, `/topics/:id`, `/chapters/:id/new`, `/auth/callback`)
    - `404.html` 폴백 파일 생성 (redirect script로 SPA 라우팅 지원)
    - `index.html`에 redirect 복원 스크립트 추가
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 1.4 MSW 테스트 인프라 구성
    - MSW 서버 설정 파일 생성 (`src/mocks/server.ts`, `src/mocks/handlers.ts`)
    - GitHub GraphQL API 기본 핸들러 작성 (GetDiscussions, CreateDiscussion, AddReaction, RemoveReaction)
    - Vitest setup 파일에서 MSW 서버 시작/종료 설정
    - _Requirements: 6.1_

- [x] 2. Checkpoint - 프로젝트 빌드 확인
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. 데이터 모델 및 유틸리티 함수 구현
  - [x] 3.1 TypeScript 인터페이스 및 타입 정의
    - `GitHubUser`, `Chapter`, `Topic`, `TopicType`, `AuthorInfo`, `TopicFormData`, `DiscussionMetadata` 인터페이스 정의
    - 도메인 타입 파일 (`src/types/index.ts`) 생성
    - _Requirements: 2.1, 4.1, 6.3_

  - [x] 3.2 Discussion ↔ Topic 매핑 함수 구현
    - `parseDiscussionMetadata(body: string): DiscussionMetadata` 구현
    - `serializeDiscussionBody(metadata: DiscussionMetadata, description: string): string` 구현
    - `discussionToTopic(discussion, chapterId): Topic` 변환 함수 구현
    - `topicFormToDiscussionInput(formData, user, categoryId): CreateDiscussionInput` 구현
    - _Requirements: 6.1, 6.3_

  - [x] 3.3 Property test: Discussion ↔ Topic 매핑 라운드트립
    - **Property 10: Discussion ↔ Topic 매핑 라운드트립**
    - serialize 후 parse하면 원본 type, isAnonymous, assignee, reason이 보존되는지 검증
    - **Validates: Requirements 6.1, 6.3**

  - [x] 3.4 챕터 유틸리티 함수 구현
    - `sortChaptersByNumber(chapters): Chapter[]` — 내림차순 정렬
    - `getNextChapterNumber(chapters): number` — 다음 번호 생성
    - `getActiveChapter(chapters): Chapter | null` — 최대 번호 챕터 반환
    - `validateChapterTitle(title: string): ValidationResult` — 제목 유효성 검증 (빈값, 50자 초과)
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6_

  - [x] 3.5 Property tests: 챕터 유틸리티 함수
    - **Property 1: 챕터 정렬 순서 보장** — 결과 배열의 인접 원소가 내림차순
    - **Property 2: 새 챕터 번호 자동 증가** — max + 1 또는 빈 배열 시 1
    - **Property 3: 활성 챕터 결정** — 최대 number 값을 가진 챕터
    - **Property 4: 챕터 제목 유효성 검증** — 빈값/초과 실패, 유효값 성공
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5, 1.6**

  - [x] 3.6 Topic 유틸리티 함수 구현
    - `validateTopicForm(data: TopicFormData): ValidationResult` — 필수 필드 검증
    - `getDisplayAuthor(user: GitHubUser, isAnonymous: boolean): AuthorInfo` — 작성자 표시 결정
    - `sortTopicsByVotes(topics: Topic[]): Topic[]` — 투표 수 기준 정렬 (동점 시 생성시간 오름차순)
    - `filterTopicsByType(topics: Topic[], type: TopicType | 'all'): Topic[]` — 필터링
    - _Requirements: 2.7, 3.2, 3.3, 5.5, 8.3_

  - [x] 3.7 Property tests: Topic 유틸리티 함수
    - **Property 5: Topic 생성 무결성** — title, type, description 보존 및 voteCount=0
    - **Property 6: Topic 폼 유효성 검증** — 필수 필드 누락 시 실패
    - **Property 7: 작성자 표시 정규화** — 익명 시 "익명", 실명 시 login
    - **Property 9: Topic 정렬 (투표 수 기준)** — 내림차순 + 동점 시 생성시간 오름차순
    - **Property 11: Topic 필터링 정확성** — 결과가 선택 타입과 일치하며 누락 없음
    - **Validates: Requirements 2.1, 2.4, 2.6, 2.7, 3.2, 3.3, 5.5, 8.3**

- [x] 4. Checkpoint - 데이터 모델 및 유틸리티 검증
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. GitHub OAuth 인증 구현
  - [x] 5.1 AuthContext 및 AuthProvider 구현
    - `AuthContext` 생성 (user, token, isAuthenticated, isLoading, login, logout, error)
    - `AuthProvider` 컴포넌트 구현 (토큰 메모리 저장, 상태 관리)
    - `useAuth` 커스텀 훅 구현
    - _Requirements: 10.1, 10.5, 10.6_

  - [x] 5.2 OAuth 콜백 페이지 및 로그인/로그아웃 플로우 구현
    - `AuthCallbackPage` 컴포넌트 (authorization code 수신 → proxy로 token 교환)
    - `LoginButton` 컴포넌트 (GitHub OAuth redirect 시작, returnPath 저장)
    - `LogoutButton` 컴포넌트 (토큰 삭제, 상태 초기화)
    - OAuth 에러 처리 (인증 실패 메시지 + 재시도)
    - _Requirements: 10.1, 10.4, 10.5, 10.6, 10.7_

  - [x] 5.3 AuthGuard 컴포넌트 구현
    - 비로그인 상태에서 쓰기 동작 차단
    - 로그인 필요 안내 메시지 + 로그인 버튼 표시
    - _Requirements: 10.2, 10.3_

  - [x] 5.4 Property test: 인증 가드 — 쓰기 동작 차단
    - **Property 13: 인증 가드 — 쓰기 동작 차단**
    - 비인증 상태에서 모든 쓰기 동작이 차단되고 로그인 안내가 표시되는지 검증
    - **Validates: Requirements 10.3**

  - [x] 5.5 단위 테스트: OAuth 플로우
    - OAuth 콜백 정상 처리 테스트
    - 로그인/로그아웃 상태 전환 테스트
    - OAuth 에러 처리 테스트 (코드 교환 실패, 파라미터 누락)
    - _Requirements: 10.4, 10.6, 10.7_

- [x] 6. GitHub GraphQL API 클라이언트 구현
  - [x] 6.1 GraphQL 클라이언트 및 useGraphQL 훅 구현
    - `useGraphQL` 훅 구현 (query, mutate 메서드)
    - 인증된 요청 시 Bearer token 헤더 자동 부착
    - 비인증 읽기 요청 지원 (token 없이 공개 API 호출)
    - 에러 처리 (네트워크 에러, GraphQL errors 필드, Rate Limit)
    - _Requirements: 6.2, 6.4, 6.5_

  - [x] 6.2 단위 테스트: GraphQL 클라이언트
    - 정상 응답 처리 테스트
    - 네트워크 에러 처리 테스트
    - 401 응답 시 자동 로그아웃 테스트
    - 로딩 상태 관리 테스트
    - _Requirements: 6.2, 6.4, 6.5_

- [x] 7. 챕터 관리 기능 구현
  - [x] 7.1 useChapters 훅 구현
    - 챕터 목록 조회 (GraphQL query)
    - 활성 챕터 자동 결정
    - 챕터 생성 mutation 호출
    - 로딩/에러 상태 관리 + 재시도
    - _Requirements: 1.1, 1.2, 1.4, 6.2_

  - [x] 7.2 ChapterListPage 및 ChapterCard 컴포넌트 구현
    - 챕터 목록 내림차순 표시
    - 활성 챕터 라벨 표시
    - 챕터 생성 폼 (제목 입력, 유효성 검증 메시지 표시)
    - 로딩/에러/빈 상태 처리
    - 반응형 레이아웃 (모바일/데스크톱)
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 9.1, 9.3, 9.4_

  - [x] 7.3 단위 테스트: 챕터 관리 컴포넌트
    - 챕터 목록 렌더링 확인
    - 활성 챕터 라벨 표시 확인
    - 제목 유효성 검증 메시지 표시 확인
    - 로딩/에러 상태 렌더링 확인
    - axe-core 접근성 검증
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 9.6_

- [x] 8. 주제(Topic) 관리 기능 구현
  - [x] 8.1 useTopics 훅 구현
    - 특정 챕터의 Topic 목록 조회 (GraphQL query)
    - Topic 생성 mutation 호출
    - 로딩/에러 상태 관리 + 재시도
    - _Requirements: 2.6, 6.2, 8.1_

  - [x] 8.2 TopicListPage, TopicCard, TopicTypeBadge 컴포넌트 구현
    - Topic 목록 표시 (타이틀, TopicType 라벨, Author, 투표 수)
    - TopicType별 시각 구분 (색상/아이콘 차별화)
    - "떠먹여 주세요" Topic에 Assignee 표시
    - Topic 클릭 시 상세 페이지 네비게이션
    - 빈 상태 안내 메시지 표시
    - 반응형 레이아웃
    - _Requirements: 4.1, 4.2, 4.3, 8.1, 8.2, 8.4, 9.1_

  - [x] 8.3 TopicFilter 및 TopicSortControl 컴포넌트 구현
    - TopicType별 필터링 UI ("전체", "고민상담", "떠먹여 드림", "떠먹여 주세요")
    - useTopicFilter, useTopicSort 훅 연동
    - 필터 결과 없음 안내 메시지
    - 정렬 옵션 (최신순, 투표순)
    - _Requirements: 5.5, 8.3, 8.5_

  - [x] 8.4 TopicDetailPage 컴포넌트 구현
    - Topic 상세 정보 표시 (타이틀, 설명, 이유, TopicType, Author, Assignee, 투표 수)
    - 돌아가기 수단 제공
    - _Requirements: 8.2_

  - [x] 8.5 Property test: Topic 카드 필수 정보 포함
    - **Property 12: Topic 카드 필수 정보 포함**
    - TopicCard 렌더링 시 title, type, author.displayName, voteCount가 모두 포함되는지 검증
    - **Validates: Requirements 8.1**

  - [x] 8.6 단위 테스트: 주제 관리 컴포넌트
    - TopicList 렌더링 확인
    - 필터링/정렬 동작 확인
    - 빈 상태/필터 결과 없음 표시 확인
    - axe-core 접근성 검증
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 9.6_

- [x] 9. 주제 생성 폼 구현
  - [x] 9.1 NewTopicPage 및 TopicForm 컴포넌트 구현
    - AuthGuard로 비로그인 차단
    - 필수 필드: 타이틀(최대 100자), TopicType 선택
    - 선택 필드: 설명(최대 500자), 이유
    - 조건부 필드: Assignee ("떠먹여 주세요" 선택 시 필수 표시)
    - "익명으로 표시" 체크박스 (기본 해제)
    - 유효성 검증 메시지 표시 (필수 필드 누락 시 제출 차단)
    - 제출 성공 시 폼 초기화 + 완료 피드백
    - 활성 챕터 없을 시 제출 비활성화 + 안내 메시지
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8, 2.9, 3.1_

  - [x] 9.2 단위 테스트: 주제 생성 폼
    - 필수 필드 검증 동작 확인
    - 조건부 Assignee 필드 표시/숨김 확인
    - 익명 체크박스 동작 확인
    - 제출 성공 시 폼 초기화 확인
    - axe-core 접근성 검증
    - _Requirements: 2.2, 2.4, 2.5, 2.7, 2.8, 3.1, 9.6_

- [x] 10. Checkpoint - 핵심 기능 검증
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. 투표(Vote) 기능 구현
  - [x] 11.1 useVote 훅 및 VoteButton 컴포넌트 구현
    - `useVote(discussionId)` 훅: 투표 상태, 투표 수, 토글 함수
    - 낙관적 업데이트 (즉시 UI 반영 → API 호출 → 실패 시 롤백)
    - GitHub Reaction API 호출 (addReaction / removeReaction mutation)
    - VoteButton: 투표 전/후 시각적 상태 구분, 투표 수 표시
    - 비로그인 시 투표 차단 + 로그인 안내 메시지
    - 로딩 중 버튼 비활성화
    - 접근성 레이블 (topicTitle 기반 aria-label)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 9.5, 9.6_

  - [x] 11.2 Property test: 투표 토글 라운드트립
    - **Property 8: 투표 토글 라운드트립**
    - addReaction → count +1, removeReaction → 원래 count 복원, voteCount >= 0 보장
    - **Validates: Requirements 5.2, 5.3, 5.6**

  - [x] 11.3 단위 테스트: 투표 기능
    - 투표 추가/취소 동작 확인
    - 낙관적 업데이트 + 롤백 동작 확인
    - 비로그인 시 차단 확인
    - 중복 투표 방지 확인
    - axe-core 접근성 검증
    - _Requirements: 5.2, 5.3, 5.4, 5.7, 9.6_

- [x] 12. 레이아웃 및 공통 UI 구현
  - [x] 12.1 Layout, Header 컴포넌트 구현
    - Header: 앱 타이틀, 로그인/로그아웃 버튼, 사용자 아바타+닉네임 표시
    - Layout: 반응형 레이아웃 컨테이너 (모바일/데스크톱)
    - 키보드 내비게이션 지원 (포커스 순서 = 시각 순서)
    - _Requirements: 9.1, 9.5, 9.6, 10.1_

  - [x] 12.2 공통 UI 컴포넌트 구현 (LoadingIndicator, ErrorMessage, EmptyState)
    - LoadingIndicator: 300ms 이상 지연 시 표시 (디바운스)
    - ErrorMessage: 에러 원인 메시지 + 재시도 버튼
    - EmptyState: 빈 상태 안내 텍스트
    - 접근성 속성 (aria-live, role 등)
    - _Requirements: 6.4, 6.5, 8.4, 8.5, 9.3, 9.4, 9.6_

  - [x] 12.3 단위 테스트: 레이아웃 및 공통 UI
    - 로그인/비로그인 상태별 Header 렌더링 확인
    - LoadingIndicator 디바운스 동작 확인
    - ErrorMessage 재시도 버튼 동작 확인
    - axe-core 접근성 검증
    - _Requirements: 9.3, 9.4, 9.6, 10.1_

- [x] 13. 전체 통합 및 와이어링
  - [x] 13.1 App 컴포넌트 통합 (AuthProvider, Router, Layout 조합)
    - App 최상위 컴포넌트에서 AuthProvider → Router → Layout 구조 조합
    - 모든 라우트와 페이지 컴포넌트 연결
    - 404 페이지 처리
    - GitHub Pages base path 적용 확인
    - _Requirements: 7.2, 7.3, 7.4, 10.2_

  - [x] 13.2 통합 테스트: 주요 사용자 플로우
    - 비로그인 상태 조회 플로우 (챕터 목록 → 주제 목록 → 주제 상세)
    - 로그인 후 주제 생성 플로우
    - 투표 추가/취소 플로우
    - 반응형 레이아웃 확인 (모바일/데스크톱 뷰포트)
    - 키보드 전용 내비게이션 플로우
    - _Requirements: 7.4, 9.1, 9.5, 10.2_

- [x] 14. Final checkpoint - 전체 테스트 통과 확인
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- MSW를 사용하여 GitHub GraphQL API 호출을 모킹하므로 실제 GitHub 토큰 없이 테스트 가능
- OAuth 프록시 서버(Cloudflare Worker/Netlify Function)는 별도 배포 필요 (이 프로젝트 범위 외)
- 디자인 토큰은 CSS 변수로 관리하여 일관된 스타일 적용

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "3.4", "3.6"] },
    { "id": 4, "tasks": ["3.3", "3.5", "3.7"] },
    { "id": 5, "tasks": ["5.1", "6.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "6.2"] },
    { "id": 7, "tasks": ["5.4", "5.5", "7.1", "8.1"] },
    { "id": 8, "tasks": ["7.2", "8.2", "8.3", "8.4", "12.1", "12.2"] },
    { "id": 9, "tasks": ["7.3", "8.5", "8.6", "9.1", "11.1", "12.3"] },
    { "id": 10, "tasks": ["9.2", "11.2", "11.3"] },
    { "id": 11, "tasks": ["13.1"] },
    { "id": 12, "tasks": ["13.2"] }
  ]
}
```
