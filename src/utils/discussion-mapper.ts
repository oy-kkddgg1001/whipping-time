/**
 * Discussion ↔ Topic 매핑 유틸리티
 *
 * GitHub Discussion의 body에 메타데이터를 HTML 코멘트로 저장/파싱하고,
 * Discussion ↔ Topic 간 변환을 수행합니다.
 */

import type {
  Topic,
  TopicType,
  TopicFormData,
  DiscussionMetadata,
  GitHubUser,
  CreateDiscussionInput,
  AuthorInfo,
} from '../types/index';

// ─── GitHub Discussion Raw API 데이터 인터페이스 ─────────────────

/** GitHub GraphQL API에서 반환하는 Discussion 원시 데이터 */
export interface GitHubDiscussion {
  /** Discussion node ID */
  id: string;
  /** Discussion 제목 */
  title: string;
  /** Discussion body (메타데이터 + 설명) */
  body: string;
  /** ISO 8601 형식 생성일시 */
  createdAt: string;
  /** Discussion 작성자 */
  author: {
    login: string;
    avatarUrl: string;
  };
  /** 라벨 목록 */
  labels: {
    nodes: Array<{ name: string }>;
  };
  /** 👍 Reaction 정보 */
  reactions: {
    totalCount: number;
    viewerHasReacted: boolean;
  };
}

// ─── 메타데이터 파싱/직렬화 ──────────────────────────────────────

const METADATA_REGEX = /<!--\s*metadata:(.*?)\s*-->/s;

const DEFAULT_METADATA: DiscussionMetadata = {
  type: '고민상담',
  isAnonymous: false,
  assignee: undefined,
  reason: undefined,
};

/**
 * Discussion body에서 메타데이터를 파싱합니다.
 *
 * 포맷: `<!-- metadata:{"type":"고민상담","isAnonymous":false,"assignee":"","reason":"..."} -->`
 *
 * 파싱 실패 시 기본 메타데이터를 반환합니다.
 */
export function parseDiscussionMetadata(body: string): DiscussionMetadata {
  try {
    const match = body.match(METADATA_REGEX);
    if (!match || !match[1]) {
      return { ...DEFAULT_METADATA };
    }

    const parsed = JSON.parse(match[1].trim());

    return {
      type: isValidTopicType(parsed.type) ? parsed.type : DEFAULT_METADATA.type,
      isAnonymous: typeof parsed.isAnonymous === 'boolean' ? parsed.isAnonymous : false,
      assignee: parsed.assignee || undefined,
      reason: parsed.reason || undefined,
      chapterId: parsed.chapterId || undefined,
    };
  } catch {
    return { ...DEFAULT_METADATA };
  }
}

/**
 * 메타데이터와 설명을 Discussion body 형식으로 직렬화합니다.
 *
 * 출력 포맷: `<!-- metadata:{...} -->\n\n{description}`
 */
export function serializeDiscussionBody(metadata: DiscussionMetadata, description: string): string {
  const metadataJson = JSON.stringify({
    type: metadata.type,
    isAnonymous: metadata.isAnonymous,
    assignee: metadata.assignee || '',
    reason: metadata.reason || '',
  });

  return `<!-- metadata:${metadataJson} -->\n\n${description}`;
}

// ─── Discussion ↔ Topic 변환 ─────────────────────────────────────

/**
 * GitHub Discussion 원시 데이터를 도메인 Topic으로 변환합니다.
 */
export function discussionToTopic(discussion: GitHubDiscussion, chapterId: string): Topic {
  const metadata = parseDiscussionMetadata(discussion.body);

  const author: AuthorInfo = metadata.isAnonymous
    ? { displayName: '익명', isAnonymous: true }
    : { displayName: discussion.author.login, isAnonymous: false };

  // body에서 메타데이터 코멘트를 제거한 나머지가 description
  const description = discussion.body.replace(METADATA_REGEX, '').trim() || undefined;

  // labels에서 TopicType 추출 (첫 번째 매칭 사용)
  const type = extractTopicTypeFromLabels(discussion.labels.nodes) ?? metadata.type;

  return {
    id: discussion.id,
    chapterId,
    title: discussion.title,
    type,
    description,
    reason: metadata.reason,
    author,
    assignee: metadata.assignee,
    voteCount: discussion.reactions.totalCount,
    hasVoted: discussion.reactions.viewerHasReacted,
    createdAt: discussion.createdAt,
  };
}

/**
 * Topic 생성 폼 데이터를 GitHub createDiscussion mutation 입력으로 변환합니다.
 */
export function topicFormToDiscussionInput(
  formData: TopicFormData,
  _user: GitHubUser,
  categoryId: string,
): CreateDiscussionInput {
  const metadata: DiscussionMetadata = {
    type: formData.type,
    isAnonymous: formData.isAnonymous,
    assignee: formData.assignee || undefined,
    reason: formData.reason || undefined,
  };

  const description = formData.description || '';
  const body = serializeDiscussionBody(metadata, description);

  return {
    repositoryId: 'REPO_ID',
    categoryId,
    title: formData.title,
    body,
  };
}

// ─── 헬퍼 함수 ──────────────────────────────────────────────────

const VALID_TOPIC_TYPES: TopicType[] = ['고민상담', '떠먹여 드림', '떠먹여 주세요'];

function isValidTopicType(value: unknown): value is TopicType {
  return typeof value === 'string' && VALID_TOPIC_TYPES.includes(value as TopicType);
}

function extractTopicTypeFromLabels(labels: Array<{ name: string }>): TopicType | null {
  for (const label of labels) {
    if (isValidTopicType(label.name)) {
      return label.name;
    }
  }
  return null;
}
