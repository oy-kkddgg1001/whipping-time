/**
 * Lightweight GraphQL client utility for GitHub GraphQL API.
 * Can be used independently of React hooks for testing and non-React contexts.
 */

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: GraphQLError[];
}

export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  type?: string;
}

export class GraphQLClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly graphqlErrors?: GraphQLError[],
  ) {
    super(message);
    this.name = 'GraphQLClientError';
  }
}

export interface GraphQLRequestOptions {
  token?: string | null;
  signal?: AbortSignal;
}

/**
 * Execute a GraphQL request against GitHub's GraphQL API.
 *
 * @param query - The GraphQL query or mutation string
 * @param variables - Optional variables for the query
 * @param options - Request options including auth token
 * @returns The data from the GraphQL response
 * @throws GraphQLClientError on network errors, GraphQL errors, or HTTP errors
 */
export async function graphqlRequest<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  options?: GraphQLRequestOptions,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  let response: Response;

  try {
    response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      signal: options?.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new GraphQLClientError('Request was aborted');
    }
    throw new GraphQLClientError(
      `Network error: ${error instanceof Error ? error.message : 'Failed to connect to GitHub API'}`,
    );
  }

  // Handle HTTP-level errors
  if (response.status === 401) {
    throw new GraphQLClientError(
      'Authentication failed: token is invalid or expired',
      401,
    );
  }

  if (response.status === 403) {
    throw new GraphQLClientError(
      'Rate limit exceeded. Please wait before making more requests.',
      403,
    );
  }

  if (!response.ok) {
    throw new GraphQLClientError(
      `HTTP error: ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  let json: GraphQLResponse<T>;

  try {
    json = await response.json();
  } catch {
    throw new GraphQLClientError('Failed to parse response as JSON');
  }

  // Handle GraphQL-level errors
  if (json.errors && json.errors.length > 0) {
    throw new GraphQLClientError(
      json.errors[0].message,
      undefined,
      json.errors,
    );
  }

  if (!json.data) {
    throw new GraphQLClientError('No data returned from GraphQL API');
  }

  return json.data;
}
