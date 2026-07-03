import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useGraphQL } from './useGraphQL';
import { GraphQLClientError } from '../utils/graphql-client';
import type { ReactNode } from 'react';

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';

// Mock AuthContext to control token/logout in tests
const mockLogout = vi.fn();
let mockToken: string | null = null;

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: mockToken,
    logout: mockLogout,
  }),
}));

// Simple wrapper (no AuthProvider needed since we mocked useAuth)
function wrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

describe('useGraphQL', () => {
  beforeEach(() => {
    mockToken = null;
    mockLogout.mockClear();
  });

  describe('query', () => {
    it('인증 없이 공개 쿼리를 실행한다', async () => {
      server.use(
        http.post(GITHUB_GRAPHQL_ENDPOINT, () => {
          return HttpResponse.json({
            data: { repository: { name: 'whipping-time' } },
          });
        }),
      );

      const { result } = renderHook(() => useGraphQL(), { wrapper });

      let data: unknown;
      await act(async () => {
        data = await result.current.query('{ repository { name } }');
      });

      expect(data).toEqual({ repository: { name: 'whipping-time' } });
    });

    it('인증된 상태에서 토큰이 헤더에 포함된다', async () => {
      mockToken = 'valid-token-abc';
      let capturedAuth: string | null = null;

      server.use(
        http.post(GITHUB_GRAPHQL_ENDPOINT, ({ request }) => {
          capturedAuth = request.headers.get('Authorization');
          return HttpResponse.json({
            data: { viewer: { login: 'testuser' } },
          });
        }),
      );

      const { result } = renderHook(() => useGraphQL(), { wrapper });

      await act(async () => {
        await result.current.query('{ viewer { login } }');
      });

      expect(capturedAuth).toBe('Bearer valid-token-abc');
    });

    it('401 응답 시 logout을 호출한다', async () => {
      mockToken = 'expired-token';

      server.use(
        http.post(GITHUB_GRAPHQL_ENDPOINT, () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      const { result } = renderHook(() => useGraphQL(), { wrapper });

      await act(async () => {
        await expect(
          result.current.query('{ viewer { login } }'),
        ).rejects.toThrow(GraphQLClientError);
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('mutate', () => {
    it('인증되지 않은 상태에서 mutation을 시도하면 에러를 던진다', async () => {
      mockToken = null;

      const { result } = renderHook(() => useGraphQL(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutate('mutation { createDiscussion { id } }'),
        ).rejects.toThrow(/Authentication required/);
      });
    });

    it('인증된 상태에서 mutation을 정상 실행한다', async () => {
      mockToken = 'valid-token';

      server.use(
        http.post(GITHUB_GRAPHQL_ENDPOINT, () => {
          return HttpResponse.json({
            data: { createDiscussion: { discussion: { id: 'D_new' } } },
          });
        }),
      );

      const { result } = renderHook(() => useGraphQL(), { wrapper });

      let data: unknown;
      await act(async () => {
        data = await result.current.mutate(
          'mutation { createDiscussion { discussion { id } } }',
        );
      });

      expect(data).toEqual({
        createDiscussion: { discussion: { id: 'D_new' } },
      });
    });

    it('401 응답 시 logout을 호출한다', async () => {
      mockToken = 'expired-token';

      server.use(
        http.post(GITHUB_GRAPHQL_ENDPOINT, () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      const { result } = renderHook(() => useGraphQL(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutate('mutation { doSomething }'),
        ).rejects.toThrow(GraphQLClientError);
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });
});
