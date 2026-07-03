import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { graphqlRequest, GraphQLClientError } from './graphql-client';

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';

describe('graphqlRequest', () => {
  it('정상 응답을 처리한다', async () => {
    server.use(
      http.post(GITHUB_GRAPHQL_ENDPOINT, () => {
        return HttpResponse.json({
          data: {
            repository: { name: 'whipping-time' },
          },
        });
      }),
    );

    const result = await graphqlRequest<{ repository: { name: string } }>(
      '{ repository { name } }',
    );

    expect(result).toEqual({ repository: { name: 'whipping-time' } });
  });

  it('네트워크 에러를 처리한다', async () => {
    server.use(
      http.post(GITHUB_GRAPHQL_ENDPOINT, () => {
        return HttpResponse.error();
      }),
    );

    await expect(graphqlRequest('{ viewer { login } }')).rejects.toThrow(
      GraphQLClientError,
    );
    await expect(graphqlRequest('{ viewer { login } }')).rejects.toThrow(
      /Network error/,
    );
  });

  it('401 응답 시 GraphQLClientError를 던진다 (statusCode 401)', async () => {
    server.use(
      http.post(GITHUB_GRAPHQL_ENDPOINT, () => {
        return new HttpResponse(null, { status: 401 });
      }),
    );

    try {
      await graphqlRequest('{ viewer { login } }', undefined, {
        token: 'expired-token',
      });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLClientError);
      expect((error as GraphQLClientError).statusCode).toBe(401);
      expect((error as GraphQLClientError).message).toMatch(
        /Authentication failed/,
      );
    }
  });

  it('403 응답 시 Rate Limit 에러를 던진다', async () => {
    server.use(
      http.post(GITHUB_GRAPHQL_ENDPOINT, () => {
        return new HttpResponse(null, { status: 403 });
      }),
    );

    try {
      await graphqlRequest('{ viewer { login } }');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLClientError);
      expect((error as GraphQLClientError).statusCode).toBe(403);
      expect((error as GraphQLClientError).message).toMatch(/Rate limit/);
    }
  });

  it('GraphQL errors 필드가 있으면 첫 번째 에러 메시지를 던진다', async () => {
    server.use(
      http.post(GITHUB_GRAPHQL_ENDPOINT, () => {
        return HttpResponse.json({
          data: null,
          errors: [
            { message: 'Field "unknown" not found', locations: [{ line: 1, column: 3 }] },
            { message: 'Second error' },
          ],
        });
      }),
    );

    try {
      await graphqlRequest('{ unknown }');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLClientError);
      expect((error as GraphQLClientError).message).toBe(
        'Field "unknown" not found',
      );
      expect((error as GraphQLClientError).graphqlErrors).toHaveLength(2);
    }
  });

  it('토큰이 제공되면 Authorization 헤더를 설정한다', async () => {
    let capturedHeaders: Headers | null = null;

    server.use(
      http.post(GITHUB_GRAPHQL_ENDPOINT, ({ request }) => {
        capturedHeaders = new Headers(request.headers);
        return HttpResponse.json({
          data: { viewer: { login: 'testuser' } },
        });
      }),
    );

    await graphqlRequest('{ viewer { login } }', undefined, {
      token: 'test-token-123',
    });

    expect(capturedHeaders).not.toBeNull();
    expect(capturedHeaders!.get('Authorization')).toBe('Bearer test-token-123');
  });

  it('토큰 없이 요청하면 Authorization 헤더가 없다', async () => {
    let capturedHeaders: Headers | null = null;

    server.use(
      http.post(GITHUB_GRAPHQL_ENDPOINT, ({ request }) => {
        capturedHeaders = new Headers(request.headers);
        return HttpResponse.json({
          data: { viewer: { login: 'anonymous' } },
        });
      }),
    );

    await graphqlRequest('{ viewer { login } }');

    expect(capturedHeaders).not.toBeNull();
    expect(capturedHeaders!.get('Authorization')).toBeNull();
  });
});
