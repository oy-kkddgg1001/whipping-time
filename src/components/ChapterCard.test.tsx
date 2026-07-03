import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { ChapterCard } from './ChapterCard';
import type { Chapter } from '../types';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const mockChapter: Chapter = {
  id: 'cat-1',
  number: 3,
  title: '3회: React Hooks 심화',
  createdAt: '2024-01-15T09:00:00Z',
};

describe('ChapterCard', () => {
  it('챕터 번호와 제목을 렌더링한다', () => {
    renderWithRouter(<ChapterCard chapter={mockChapter} isActive={false} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('3회: React Hooks 심화')).toBeInTheDocument();
  });

  it('isActive=true일 때 "활성" 배지를 표시한다', () => {
    renderWithRouter(<ChapterCard chapter={mockChapter} isActive={true} />);

    expect(screen.getByText('활성')).toBeInTheDocument();
  });

  it('isActive=false일 때 "활성" 배지를 표시하지 않는다', () => {
    renderWithRouter(<ChapterCard chapter={mockChapter} isActive={false} />);

    expect(screen.queryByText('활성')).not.toBeInTheDocument();
  });

  it('/chapters/:id 경로로 링크를 생성한다', () => {
    renderWithRouter(<ChapterCard chapter={mockChapter} isActive={false} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/chapters/cat-1');
  });

  it('접근성 위반이 없다', async () => {
    const { container } = renderWithRouter(
      <ChapterCard chapter={mockChapter} isActive={true} />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
