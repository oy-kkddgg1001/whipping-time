import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { graphql, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import App from '../App';
import { VoteButton } from '../components/VoteButton';
import { useEffect } from 'react';

// Mock categories with numbers for chapters
const mockCategories = [
  {
    id: 'CAT_chapter1',
    name: '1회: React Basics',
    description: 'chapter:1',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'CAT_chapter2',
    name: '2회: Advanced Hooks',
    description: 'chapter:2',
    createdAt: '2024-01-08T00:00:00Z',
  },
  {
    id: 'CAT_chapter3',
    name: '3회: Server Components',
    description: 'chapter:3',
    createdAt: '2024-01-15T00:00:00Z',
  },
];

const mockRepositoryId = 'R_kgDOTestRepo123';

/**
 * Helper: Wraps the App component with MemoryRouter + AuthProvider (unauthenticated)
 */
function renderApp(initialRoute = '/') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  );
}

/**
 * Helper component that auto-authenticates using setAuthData from AuthProvider.
 * Renders nothing - just sets auth state on mount.
 */
function AutoLogin() {
  const { setAuthData } = useAuth();
  useEffect(() => {
    setAuthData('test-token-123', {
      login: 'testuser',
      avatarUrl: 'https://avatars.githubusercontent.com/u/999',
      id: 'MDQ6VXNlcjk5OQ==',
    });
  }, [setAuthData]);
  return null;
}

/**
 * Helper: Wraps the App with MemoryRouter + AuthProvider in authenticated state.
 */
function renderAuthenticatedApp(initialRoute = '/') {
  return render(
    <AuthProvider>
      <AutoLogin />
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  );
}

/**
 * Setup MSW handlers for chapters (GetCategories) and repository ID.
 */
function setupChapterHandlers() {
  server.use(
    graphql.query('GetCategories', () => {
      return HttpResponse.json({
        data: {
          repository: {
            discussionCategories: {
              nodes: mockCategories,
            },
          },
        },
      });
    }),
    graphql.query('GetRepositoryId', () => {
      return HttpResponse.json({
        data: {
          repository: {
            id: mockRepositoryId,
          },
        },
      });
    }),
  );
}

describe('통합 테스트: 주요 사용자 플로우', () => {
  describe('1. 비로그인 상태 조회 플로우', () => {
    it('앱이 "/" 경로에서 크래시 없이 렌더링된다', async () => {
      setupChapterHandlers();
      renderApp('/');

      // App should render without crashing - header with title link is present
      expect(
        screen.getByLabelText('Whipping Time 홈으로 이동'),
      ).toBeInTheDocument();
    });

    it('비로그인 상태에서 챕터 목록 로딩 후 데이터를 표시한다', async () => {
      setupChapterHandlers();
      renderApp('/');

      // Should eventually show chapters from mock data
      await waitFor(() => {
        expect(screen.getByText('챕터 목록')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/3회/)).toBeInTheDocument();
      });
    });

    it('비로그인 상태에서 로그인 버튼이 헤더에 표시된다', async () => {
      setupChapterHandlers();
      renderApp('/');

      expect(screen.getByLabelText('GitHub로 로그인')).toBeInTheDocument();
    });
  });

  describe('2. 로그인 후 주제 생성 플로우', () => {
    it('비로그인 상태에서 /chapters/:id/new 접근 시 AuthGuard가 로그인 안내를 표시한다', async () => {
      setupChapterHandlers();
      renderApp('/chapters/CAT_chapter3/new');

      await waitFor(() => {
        expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument();
      });
    });

    it('인증된 상태에서 주제 생성 폼이 표시되고 제출 시 성공 피드백을 보여준다', async () => {
      setupChapterHandlers();

      // Setup additional handlers for topic creation flow
      server.use(
        graphql.mutation('CreateDiscussion', ({ variables }) => {
          return HttpResponse.json({
            data: {
              createDiscussion: {
                discussion: {
                  id: `D_new_${Date.now()}`,
                  title: variables.title as string,
                  createdAt: new Date().toISOString(),
                },
              },
            },
          });
        }),
        graphql.query('GetDiscussions', () => {
          return HttpResponse.json({
            data: {
              repository: {
                discussions: {
                  nodes: [],
                },
              },
            },
          });
        }),
      );

      renderAuthenticatedApp('/chapters/CAT_chapter3/new');

      // Wait for the topic form to load
      await waitFor(() => {
        expect(screen.getByText('새 주제 등록')).toBeInTheDocument();
      });

      // Fill in the title field
      const titleInput = screen.getByPlaceholderText('주제 제목을 입력하세요');
      await userEvent.type(titleInput, 'React 19 새 기능 소개');

      // Select topic type - 고민상담
      const radioButton = screen.getByLabelText('고민상담');
      await userEvent.click(radioButton);

      // Submit the form
      const submitButton = screen.getByRole('button', { name: '주제 등록' });
      await userEvent.click(submitButton);

      // Verify success feedback
      await waitFor(() => {
        expect(screen.getByText('주제가 등록되었습니다')).toBeInTheDocument();
      });
    });
  });

  describe('3. 투표 플로우', () => {
    it('인증 상태에서 투표 버튼 클릭 시 카운트가 낙관적으로 증가한다', () => {
      const onClick = vi.fn();
      const { rerender } = render(
        <VoteButton
          count={5}
          hasVoted={false}
          isAuthenticated={true}
          isLoading={false}
          onClick={onClick}
          topicTitle="React 투표 테스트"
        />,
      );

      const button = screen.getByRole('button', {
        name: 'React 투표 테스트에 투표하기',
      });
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);

      // Simulate optimistic update by rerendering with new count
      rerender(
        <VoteButton
          count={6}
          hasVoted={true}
          isAuthenticated={true}
          isLoading={false}
          onClick={onClick}
          topicTitle="React 투표 테스트"
        />,
      );

      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('투표 취소 시 카운트가 감소한다', () => {
      const onClick = vi.fn();
      const { rerender } = render(
        <VoteButton
          count={6}
          hasVoted={true}
          isAuthenticated={true}
          isLoading={false}
          onClick={onClick}
          topicTitle="React 투표 테스트"
        />,
      );

      const button = screen.getByRole('button', {
        name: 'React 투표 테스트 투표 취소하기',
      });
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);

      // Simulate optimistic update
      rerender(
        <VoteButton
          count={5}
          hasVoted={false}
          isAuthenticated={true}
          isLoading={false}
          onClick={onClick}
          topicTitle="React 투표 테스트"
        />,
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('비로그인 상태에서 투표 버튼 클릭 시 로그인 안내 메시지를 표시한다', () => {
      const onClick = vi.fn();
      render(
        <VoteButton
          count={3}
          hasVoted={false}
          isAuthenticated={false}
          isLoading={false}
          onClick={onClick}
          topicTitle="비로그인 투표 테스트"
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: '비로그인 투표 테스트에 투표하기' }),
      );

      expect(onClick).not.toHaveBeenCalled();
      expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument();
    });
  });

  describe('4. 키보드 내비게이션 플로우', () => {
    it('Tab 키로 인터랙티브 요소 간 포커스가 이동한다', async () => {
      setupChapterHandlers();
      renderApp('/');

      const user = userEvent.setup();

      // Wait for app to render
      await waitFor(() => {
        expect(
          screen.getByLabelText('Whipping Time 홈으로 이동'),
        ).toBeInTheDocument();
      });

      // Tab to first interactive element
      await user.tab();

      const firstFocused = document.activeElement;
      expect(firstFocused).not.toBe(document.body);
      expect(firstFocused?.tagName).toMatch(/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/);

      // Tab to next interactive element
      await user.tab();
      const secondFocused = document.activeElement;
      expect(secondFocused).not.toBe(document.body);
      expect(secondFocused).not.toBe(firstFocused);
    });

    it('포커스 순서가 헤더에서 시작한다 (시각적 레이아웃 순서)', async () => {
      setupChapterHandlers();
      renderApp('/');

      const user = userEvent.setup();

      await waitFor(() => {
        expect(
          screen.getByLabelText('Whipping Time 홈으로 이동'),
        ).toBeInTheDocument();
      });

      // First Tab should focus an element within the site header (nav area)
      await user.tab();

      const siteNav = screen.getByLabelText('사용자 메뉴');
      const homeLink = screen.getByLabelText('Whipping Time 홈으로 이동');
      const focusedElement = document.activeElement;

      // First focused element should be the home link in the header
      // or at minimum within the header area (home link or nav)
      const isInHeader =
        focusedElement === homeLink ||
        siteNav.contains(focusedElement) ||
        homeLink.parentElement?.contains(focusedElement);

      expect(isInHeader).toBe(true);
    });
  });

  describe('5. 404 페이지 처리', () => {
    it('존재하지 않는 경로 접근 시 404 페이지가 표시된다', async () => {
      setupChapterHandlers();
      renderApp('/unknown-page-that-does-not-exist');

      await waitFor(() => {
        expect(
          screen.getByText('404 - 페이지를 찾을 수 없습니다'),
        ).toBeInTheDocument();
      });
    });

    it('404 페이지에 홈으로 돌아가기 링크가 제공된다', async () => {
      setupChapterHandlers();
      renderApp('/non-existent-route');

      await waitFor(() => {
        expect(screen.getByText('홈으로 돌아가기')).toBeInTheDocument();
      });

      const homeLink = screen.getByRole('link', { name: '홈으로 돌아가기' });
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });
});
