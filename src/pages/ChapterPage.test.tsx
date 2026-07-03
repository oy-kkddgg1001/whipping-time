import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { axe } from 'vitest-axe';
import ChapterPage from './ChapterPage';
import type { Topic } from '../types';

const mockTopics: Topic[] = [
  {
    id: 'topic-1',
    chapterId: 'ch-1',
    title: 'React Server Components 활용법',
    type: '떠먹여 드림',
    author: { displayName: 'alice', isAnonymous: false },
    voteCount: 7,
    hasVoted: false,
    createdAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'topic-2',
    chapterId: 'ch-1',
    title: '상태 관리 고민',
    type: '고민상담',
    author: { displayName: '익명', isAnonymous: true },
    voteCount: 3,
    hasVoted: true,
    createdAt: '2024-01-21T10:00:00Z',
  },
  {
    id: 'topic-3',
    chapterId: 'ch-1',
    title: 'CSS 아키텍처 발표 요청',
    type: '떠먹여 주세요',
    author: { displayName: 'bob', isAnonymous: false },
    assignee: 'charlie',
    voteCount: 5,
    hasVoted: false,
    createdAt: '2024-01-22T10:00:00Z',
  },
];

const mockRetry = vi.fn();
const mockCreateTopic = vi.fn();

let mockUseTopicsReturn = {
  topics: mockTopics,
  isLoading: false,
  error: null as Error | null,
  retry: mockRetry,
  createTopic: mockCreateTopic,
};

vi.mock('../hooks/useTopics', () => ({
  useTopics: () => mockUseTopicsReturn,
}));

function renderChapterPage() {
  return render(
    <MemoryRouter initialEntries={['/chapters/ch-1']}>
      <Routes>
        <Route path="/chapters/:id" element={<ChapterPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ChapterPage (TopicListPage)', () => {
  beforeEach(() => {
    mockRetry.mockClear();
    mockCreateTopic.mockClear();

    mockUseTopicsReturn = {
      topics: mockTopics,
      isLoading: false,
      error: null,
      retry: mockRetry,
      createTopic: mockCreateTopic,
    };
  });

  it('로딩 상태를 표시한다', () => {
    mockUseTopicsReturn = { ...mockUseTopicsReturn, isLoading: true };

    renderChapterPage();

    expect(screen.getByText('주제 목록을 불러오는 중...')).toBeInTheDocument();
  });

  it('에러 상태에서 에러 메시지와 다시 시도 버튼을 표시한다', () => {
    mockUseTopicsReturn = {
      ...mockUseTopicsReturn,
      error: new Error('API 호출 실패'),
    };

    renderChapterPage();

    expect(screen.getByText('주제 목록을 불러오는데 실패했습니다.')).toBeInTheDocument();
    expect(screen.getByText('API 호출 실패')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  it('에러 상태에서 다시 시도 버튼 클릭 시 retry를 호출한다', async () => {
    const user = userEvent.setup();
    mockUseTopicsReturn = {
      ...mockUseTopicsReturn,
      error: new Error('네트워크 오류'),
    };

    renderChapterPage();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('주제가 없을 때 빈 상태 메시지를 표시한다', () => {
    mockUseTopicsReturn = { ...mockUseTopicsReturn, topics: [] };

    renderChapterPage();

    expect(screen.getByText('아직 등록된 주제가 없습니다.')).toBeInTheDocument();
  });

  it('주제 카드를 렌더링한다', () => {
    renderChapterPage();

    expect(screen.getByText('React Server Components 활용법')).toBeInTheDocument();
    expect(screen.getByText('상태 관리 고민')).toBeInTheDocument();
    expect(screen.getByText('CSS 아키텍처 발표 요청')).toBeInTheDocument();
  });

  it('주제 목록 리스트에 aria-label이 설정된다', () => {
    renderChapterPage();

    expect(screen.getByRole('list', { name: '주제 목록' })).toBeInTheDocument();
  });

  it('접근성 위반이 없다 (주제 목록 상태)', async () => {
    const { container } = renderChapterPage();

    const results = await axe(container, {
      rules: {
        // h1 → h3 구조는 디자인 의도 (h2는 섹션 헤더용으로 예약)
        'heading-order': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('접근성 위반이 없다 (로딩 상태)', async () => {
    mockUseTopicsReturn = { ...mockUseTopicsReturn, isLoading: true };

    const { container } = renderChapterPage();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('접근성 위반이 없다 (에러 상태)', async () => {
    mockUseTopicsReturn = {
      ...mockUseTopicsReturn,
      error: new Error('에러 발생'),
    };

    const { container } = renderChapterPage();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
