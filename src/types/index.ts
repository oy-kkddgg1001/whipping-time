/**
 * Whipping Time 도메인 타입 정의
 *
 * GitHub Discussions API 기반의 프론트엔드 챕터 주제 선정 도구에서 사용하는
 * 핵심 인터페이스 및 타입을 정의합니다.
 */

// ─── GitHub 사용자 ───────────────────────────────────────────────

/** GitHub OAuth로 인증된 사용자 정보 */
export interface GitHubUser {
  /** GitHub 사용자명 */
  login: string;
  /** 프로필 이미지 URL */
  avatarUrl: string;
  /** GitHub node ID */
  id: string;
}

// ─── 챕터 (Chapter) ──────────────────────────────────────────────

/** 프론트엔드 챕터의 한 회차 세션 */
export interface Chapter {
  /** Discussion Category ID (GitHub node ID) */
  id: string;
  /** 챕터 회차 번호 */
  number: number;
  /** 챕터 제목 (1~50자) */
  title: string;
  /** ISO 8601 형식 생성일시 */
  createdAt: string;
}

// ─── 주제 유형 (TopicType) ───────────────────────────────────────

/** 주제의 유형 분류 */
export type TopicType = '고민상담' | '떠먹여 드림' | '떠먹여 주세요';

// ─── 작성자 정보 (AuthorInfo) ────────────────────────────────────

/** 주제 작성자의 표시 정보 */
export interface AuthorInfo {
  /** 화면 표시 이름 ("익명" 또는 GitHub login) */
  displayName: string;
  /** 익명 여부 */
  isAnonymous: boolean;
}

// ─── 주제 (Topic) ────────────────────────────────────────────────

/** 챕터에서 다룰 주제 제안 항목 */
export interface Topic {
  /** Discussion node ID */
  id: string;
  /** 소속 챕터(Category) ID */
  chapterId: string;
  /** 주제 타이틀 (1~100자) */
  title: string;
  /** 주제 유형 */
  type: TopicType;
  /** 설명 (최대 500자, 선택) */
  description?: string;
  /** 이유 (선택) */
  reason?: string;
  /** 작성자 정보 */
  author: AuthorInfo;
  /** 지목 대상 ("떠먹여 주세요" 전용) */
  assignee?: string;
  /** 👍 Reaction 수 (0 이상) */
  voteCount: number;
  /** 현재 사용자의 투표 여부 */
  hasVoted: boolean;
  /** ISO 8601 형식 생성일시 */
  createdAt: string;
}

// ─── 주제 제출 폼 데이터 (TopicFormData) ─────────────────────────

/** Topic 생성 시 사용자가 입력하는 폼 데이터 */
export interface TopicFormData {
  /** 주제 타이틀 */
  title: string;
  /** 주제 유형 */
  type: TopicType;
  /** 설명 (최대 500자, 선택) */
  description?: string;
  /** 이유 (선택) */
  reason?: string;
  /** "익명으로 표시" 체크박스 상태 */
  isAnonymous: boolean;
  /** 지목 대상 (type이 "떠먹여 주세요"일 때 필수) */
  assignee?: string;
}

// ─── Discussion 메타데이터 ───────────────────────────────────────

/** Discussion body에 JSON frontmatter로 저장되는 메타데이터 */
export interface DiscussionMetadata {
  /** 주제 유형 */
  type: TopicType;
  /** 익명 여부 */
  isAnonymous: boolean;
  /** 지목 대상 (선택) */
  assignee?: string;
  /** 이유 (선택) */
  reason?: string;
  /** 소속 챕터 Discussion ID */
  chapterId?: string;
}

// ─── 유효성 검증 결과 ────────────────────────────────────────────

/** 폼 또는 데이터 유효성 검증 결과 */
export interface ValidationResult {
  /** 검증 통과 여부 */
  valid: boolean;
  /** 검증 실패 시 에러 메시지 목록 */
  errors: string[];
}

// ─── GraphQL Mutation 입력 ───────────────────────────────────────

/** GitHub Discussions API createDiscussion mutation 입력 */
export interface CreateDiscussionInput {
  /** Repository node ID */
  repositoryId: string;
  /** Discussion Category node ID (챕터 ID) */
  categoryId: string;
  /** Discussion 제목 */
  title: string;
  /** Discussion body (메타데이터 + 설명) */
  body: string;
}
