import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { TopicCard } from './TopicCard';
import type { Topic } from '../types';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const mockTopic: Topic = {
  id: 'topic-1',
  chapterId: 'ch-1',
  title: 'React Server Components 도입 경험 공유',
  type: '떠먹여 드림',
  description: '실무 적용 사례 공유',
  author: { displayName: 'testuser', isAnonymous: false },
  voteCount: 5,
  hasVoted: false,
  createdAt: '2024-01-20T10:00:00Z',
};

const mockTopicWithAssignee: Topic = {
  id: 'topic-2',
  chapterId: 'ch-1',
  title: 'CSS-in-JS 비교 분석',
  type: '떠먹여 주세요',
  description: '각 라이브러리 비교',
  author: { displayName: '익명', isAnonymous: true },
  assignee: 'kimdev',
  voteCount: 3,
  hasVoted: true,
  createdAt: '2024-01-21T10:00:00Z',
};

describe('TopicCard', () => {
  it('주제 제목, 유형 배지, 작성자, 투표 수를 렌더링한다', () => {
    renderWithRouter(<TopicCard topic={mockTopic} />);

    expect(screen.getByText('React Server Components 도입 경험 공유')).toBeInTheDocument();
    expect(screen.getByText('떠먹여 드림')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('"떠먹여 주세요" 유형일 때 assignee를 표시한다', () => {
    renderWithRouter(<TopicCard topic={mockTopicWithAssignee} />);

    expect(screen.getByText(/kimdev/)).toBeInTheDocument();
  });

  it('"떠먹여 드림" 유형일 때 assignee를 표시하지 않는다', () => {
    renderWithRouter(<TopicCard topic={mockTopic} />);

    expect(screen.queryByText(/→/)).not.toBeInTheDocument();
  });

  it('/topics/:id 경로로 링크를 생성한다', () => {
    renderWithRouter(<TopicCard topic={mockTopic} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/topics/topic-1');
  });

  it('접근성 위반이 없다', async () => {
    const { container } = renderWithRouter(<TopicCard topic={mockTopic} />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
