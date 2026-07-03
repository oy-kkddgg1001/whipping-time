// Feature: whipping-time, Property 13: 인증 가드 — 쓰기 동작 차단
import fc from 'fast-check';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthGuard } from './AuthGuard';

// Mock useAuth context
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock LoginButton since it also uses useAuth internally
vi.mock('./LoginButton', () => ({
  default: () => <button>GitHub로 로그인</button>,
}));

// ─── Shared Arbitraries ──────────────────────────────────────────

const writeActionArb = fc.constantFrom('createTopic', 'vote', 'createChapter');

// ─── Property 13: 인증 가드 — 쓰기 동작 차단 ────────────────────

/**
 * Property 13: 인증 가드 — 쓰기 동작 차단
 *
 * For any write action (createTopic, vote, createChapter), when the user is NOT
 * authenticated, AuthGuard should block the action (not render children) and
 * display a login prompt instead.
 *
 * **Validates: Requirements 10.3**
 */
describe('Property 13: 인증 가드 — 쓰기 동작 차단', () => {
  it('비인증 상태에서 모든 쓰기 동작이 차단되고 로그인 안내가 표시됨', () => {
    fc.assert(
      fc.property(writeActionArb, (actionType) => {
        mockUseAuth.mockReturnValue({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          token: null,
          login: vi.fn(),
          logout: vi.fn(),
          setAuthData: vi.fn(),
          error: null,
        });

        const { unmount } = render(
          <AuthGuard>
            <div data-testid="protected-content">
              {actionType} action content
            </div>
          </AuthGuard>,
        );

        // Children should NOT be rendered
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

        // Login prompt should be displayed
        expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument();

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('비인증 상태에서 로그인 버튼이 표시됨', () => {
    fc.assert(
      fc.property(writeActionArb, (actionType) => {
        mockUseAuth.mockReturnValue({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          token: null,
          login: vi.fn(),
          logout: vi.fn(),
          setAuthData: vi.fn(),
          error: null,
        });

        const { unmount } = render(
          <AuthGuard>
            <div data-testid="protected-content">
              {actionType} action content
            </div>
          </AuthGuard>,
        );

        // Login button should be present
        expect(screen.getByText('GitHub로 로그인')).toBeInTheDocument();

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('인증 상태에서 모든 쓰기 동작의 children이 정상 렌더링됨', () => {
    fc.assert(
      fc.property(writeActionArb, (actionType) => {
        mockUseAuth.mockReturnValue({
          isAuthenticated: true,
          isLoading: false,
          user: { login: 'testuser', avatarUrl: 'https://example.com/avatar', id: 'u1' },
          token: 'test-token',
          login: vi.fn(),
          logout: vi.fn(),
          setAuthData: vi.fn(),
          error: null,
        });

        const { unmount } = render(
          <AuthGuard>
            <div data-testid="protected-content">
              {actionType} action content
            </div>
          </AuthGuard>,
        );

        // Children SHOULD be rendered
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.getByTestId('protected-content')).toHaveTextContent(
          `${actionType} action content`,
        );

        // Login prompt should NOT be displayed
        expect(screen.queryByText('로그인이 필요합니다')).not.toBeInTheDocument();

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
