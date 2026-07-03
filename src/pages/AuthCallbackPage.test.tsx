import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import AuthCallbackPage from './AuthCallbackPage';
import type { ReactNode } from 'react';

// Mock useAuth
const mockSetAuthData = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    setAuthData: mockSetAuthData,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const OAUTH_PROXY_URL = 'https://whipping-time-proxy.example.com/token';

function renderWithRouter(children: ReactNode, initialEntries: string[] = ['/auth/callback']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>,
  );
}

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    mockSetAuthData.mockClear();
    mockNavigate.mockClear();
  });

  it('code 파라미터가 있을 때 로딩 상태를 표시한다', () => {
    // Mock a successful but slow response
    server.use(
      http.post(OAUTH_PROXY_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return HttpResponse.json({ access_token: 'token123' });
      }),
    );

    renderWithRouter(<AuthCallbackPage />, ['/auth/callback?code=abc123']);

    expect(screen.getByText('인증 처리 중...')).toBeInTheDocument();
  });

  it('code 파라미터가 없으면 에러 메시지를 표시한다', async () => {
    renderWithRouter(<AuthCallbackPage />, ['/auth/callback']);

    await waitFor(() => {
      expect(screen.getByText(/인증 코드가 없습니다/)).toBeInTheDocument();
    });
  });

  it('토큰 교환 성공 시 setAuthData를 호출하고 네비게이션한다', async () => {
    server.use(
      http.post(OAUTH_PROXY_URL, () => {
        return HttpResponse.json({ access_token: 'valid-token-xyz' });
      }),
      http.get('https://api.github.com/user', () => {
        return HttpResponse.json({
          login: 'testuser',
          avatar_url: 'https://avatar.example.com/1',
          node_id: 'U_node123',
        });
      }),
    );

    renderWithRouter(<AuthCallbackPage />, ['/auth/callback?code=valid-code']);

    await waitFor(() => {
      expect(mockSetAuthData).toHaveBeenCalledWith('valid-token-xyz', {
        login: 'testuser',
        avatarUrl: 'https://avatar.example.com/1',
        id: 'U_node123',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('토큰 교환 실패 시 (프록시 에러) 에러 메시지를 표시한다', async () => {
    server.use(
      http.post(OAUTH_PROXY_URL, () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    renderWithRouter(<AuthCallbackPage />, ['/auth/callback?code=bad-code']);

    await waitFor(() => {
      expect(screen.getByText('토큰 교환에 실패했습니다.')).toBeInTheDocument();
    });
  });

  it('사용자 정보 조회 실패 시 에러 메시지를 표시한다', async () => {
    server.use(
      http.post(OAUTH_PROXY_URL, () => {
        return HttpResponse.json({ access_token: 'valid-token' });
      }),
      http.get('https://api.github.com/user', () => {
        return new HttpResponse(null, { status: 403 });
      }),
    );

    renderWithRouter(<AuthCallbackPage />, ['/auth/callback?code=some-code']);

    await waitFor(() => {
      expect(screen.getByText('사용자 정보를 가져오는데 실패했습니다.')).toBeInTheDocument();
    });
  });
});
