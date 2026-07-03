import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import HomePage from './HomePage';
import type { Chapter } from '../types';

// Mock data
const mockChapters: Chapter[] = [
  { id: 'ch-3', number: 3, title: '3회: React Hooks', createdAt: '2024-03-01T09:00:00Z' },
  { id: 'ch-2', number: 2, title: '2회: TypeScript', createdAt: '2024-02-01T09:00:00Z' },
  { id: 'ch-1', number: 1, title: '1회: Vite 소개', createdAt: '2024-01-01T09:00:00Z' },
];

const mockRetry = vi.fn();
const mockCreateChapter = vi.fn();

// Default mock values
let mockUseChaptersReturn = {
  chapters: mockChapters,
  activeChapter: mockChapters[0] as Chapter | null, // ch-3 is the active chapter (highest number)
  isLoading: false,
  error: null as Error | null,
  retry: mockRetry,
  createChapter: mockCreateChapter,
};

let mockUseAuthReturn = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  setAuthData: vi.fn(),
  error: null,
};

vi.mock('../hooks/useChapters', () => ({
  useChapters: () => mockUseChaptersReturn,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuthReturn,
}));

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    mockRetry.mockClear();
    mockCreateChapter.mockClear();

    // Reset to default values
    mockUseChaptersReturn = {
      chapters: mockChapters,
      activeChapter: mockChapters[0],
      isLoading: false,
      error: null,
      retry: mockRetry,
      createChapter: mockCreateChapter,
    };

    mockUseAuthReturn = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      setAuthData: vi.fn(),
      error: null,
    };
  });

  it('isLoading=true일 때 로딩 상태를 표시한다', () => {
    mockUseChaptersReturn = { ...mockUseChaptersReturn, isLoading: true };

    renderHomePage();

    expect(screen.getByText('챕터 목록을 불러오는 중...')).toBeInTheDocument();
  });

  it('에러 발생 시 에러 메시지와 다시 시도 버튼을 표시한다', () => {
    mockUseChaptersReturn = {
      ...mockUseChaptersReturn,
      error: new Error('네트워크 오류'),
    };

    renderHomePage();

    expect(screen.getByText('데이터를 불러올 수 없습니다')).toBeInTheDocument();
    expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  it('에러 상태에서 다시 시도 버튼 클릭 시 retry를 호출한다', async () => {
    const user = userEvent.setup();
    mockUseChaptersReturn = {
      ...mockUseChaptersReturn,
      error: new Error('네트워크 오류'),
    };

    renderHomePage();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('챕터가 비어 있을 때 빈 상태를 표시한다', () => {
    mockUseChaptersReturn = {
      ...mockUseChaptersReturn,
      chapters: [],
      activeChapter: null,
    };

    renderHomePage();

    expect(screen.getByText('아직 챕터가 없습니다')).toBeInTheDocument();
  });

  it('챕터 카드에 번호와 제목이 올바르게 표시된다', () => {
    renderHomePage();

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('3회: React Hooks')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('2회: TypeScript')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('1회: Vite 소개')).toBeInTheDocument();
  });

  it('활성 챕터 카드에 "활성" 배지가 표시된다', () => {
    renderHomePage();

    expect(screen.getByText('활성')).toBeInTheDocument();
  });

  it('인증된 사용자에게 챕터 생성 폼을 표시한다', () => {
    mockUseAuthReturn = { ...mockUseAuthReturn, isAuthenticated: true };

    renderHomePage();

    expect(screen.getByText('새 챕터 생성')).toBeInTheDocument();
    expect(screen.getByLabelText('챕터 제목')).toBeInTheDocument();
  });

  it('비인증 사용자에게 챕터 생성 폼을 표시하지 않는다', () => {
    mockUseAuthReturn = { ...mockUseAuthReturn, isAuthenticated: false };

    renderHomePage();

    expect(screen.queryByText('새 챕터 생성')).not.toBeInTheDocument();
  });

  it('빈 제목으로 제출 시 유효성 검증 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    mockUseAuthReturn = { ...mockUseAuthReturn, isAuthenticated: true };

    renderHomePage();

    // Submit the form with an empty title
    await user.click(screen.getByRole('button', { name: '생성' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('접근성 위반이 없다 (챕터 목록 상태)', async () => {
    mockUseAuthReturn = { ...mockUseAuthReturn, isAuthenticated: true };

    const { container } = renderHomePage();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('접근성 위반이 없다 (로딩 상태)', async () => {
    mockUseChaptersReturn = { ...mockUseChaptersReturn, isLoading: true };

    const { container } = renderHomePage();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('접근성 위반이 없다 (에러 상태)', async () => {
    mockUseChaptersReturn = {
      ...mockUseChaptersReturn,
      error: new Error('에러 발생'),
    };

    const { container } = renderHomePage();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
