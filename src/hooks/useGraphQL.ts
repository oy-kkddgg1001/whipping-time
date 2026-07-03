import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest, GraphQLClientError } from '../utils/graphql-client';

/**
 * React hook for making GraphQL requests to GitHub's API.
 *
 * - `query`: Makes a GraphQL query. Works with or without authentication.
 *   Unauthenticated queries can access public data.
 * - `mutate`: Makes a GraphQL mutation. Requires authentication.
 *   Throws if the user is not authenticated.
 *
 * Handles:
 * - Automatic Bearer token attachment for authenticated requests
 * - Auto-logout on 401 responses (token expiry)
 * - Network error handling
 * - GraphQL errors field parsing
 * - Rate limit (403) error messaging
 */
export function useGraphQL(): {
  query: <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;
  mutate: <T>(mutation: string, variables?: Record<string, unknown>) => Promise<T>;
} {
  const { token, logout } = useAuth();

  const query = useCallback(
    async <T>(queryStr: string, variables?: Record<string, unknown>): Promise<T> => {
      try {
        return await graphqlRequest<T>(queryStr, variables, { token });
      } catch (error) {
        if (error instanceof GraphQLClientError && error.statusCode === 401) {
          logout();
        }
        throw error;
      }
    },
    [token, logout],
  );

  const mutate = useCallback(
    async <T>(mutation: string, variables?: Record<string, unknown>): Promise<T> => {
      if (!token) {
        throw new GraphQLClientError(
          'Authentication required: please log in to perform this action',
        );
      }

      try {
        return await graphqlRequest<T>(mutation, variables, { token });
      } catch (error) {
        if (error instanceof GraphQLClientError && error.statusCode === 401) {
          logout();
        }
        throw error;
      }
    },
    [token, logout],
  );

  return { query, mutate };
}
