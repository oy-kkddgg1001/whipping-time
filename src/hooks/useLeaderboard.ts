import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../utils/graphql-client';

const OWNER = import.meta.env.VITE_GITHUB_OWNER || 'oy-kkddgg1001';
const REPO = import.meta.env.VITE_GITHUB_REPO || 'whipping-time';

const ALL_DISCUSSIONS_QUERY = `
  query AllDiscussions($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      discussions(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          id
          author { login avatarUrl }
          reactions(content: THUMBS_UP) { totalCount }
          comments(first: 100) {
            nodes {
              author { login avatarUrl }
            }
          }
        }
      }
    }
  }
`;

export interface LeaderboardUser {
  login: string;
  avatarUrl: string;
  score: number;
}

export interface LeaderboardData {
  thumbsUpKing: LeaderboardUser[];
  commentKing: LeaderboardUser[];
  ideaKing: LeaderboardUser[];
}

interface DiscussionAuthor {
  login: string;
  avatarUrl: string;
}

interface DiscussionNode {
  id: string;
  author: DiscussionAuthor | null;
  reactions: { totalCount: number };
  comments: {
    nodes: Array<{ author: DiscussionAuthor | null }>;
  };
}

interface AllDiscussionsResponse {
  repository: {
    discussions: {
      nodes: DiscussionNode[];
    };
  };
}

function processLeaderboardData(data: AllDiscussionsResponse): LeaderboardData {
  const thumbsUpMap = new Map<string, LeaderboardUser>();
  const commentMap = new Map<string, LeaderboardUser>();
  const ideaMap = new Map<string, LeaderboardUser>();

  const discussions = data.repository.discussions.nodes;

  for (const discussion of discussions) {
    const author = discussion.author;
    if (!author) continue;

    // 따봉왕: sum of thumbs up reactions attributed to discussion author
    const existing = thumbsUpMap.get(author.login);
    if (existing) {
      existing.score += discussion.reactions.totalCount;
    } else {
      thumbsUpMap.set(author.login, {
        login: author.login,
        avatarUrl: author.avatarUrl,
        score: discussion.reactions.totalCount,
      });
    }

    // 아이디어왕: count discussions per author
    const ideaExisting = ideaMap.get(author.login);
    if (ideaExisting) {
      ideaExisting.score += 1;
    } else {
      ideaMap.set(author.login, {
        login: author.login,
        avatarUrl: author.avatarUrl,
        score: 1,
      });
    }

    // 수다왕: count comments per author
    for (const comment of discussion.comments.nodes) {
      const commentAuthor = comment.author;
      if (!commentAuthor) continue;

      const commentExisting = commentMap.get(commentAuthor.login);
      if (commentExisting) {
        commentExisting.score += 1;
      } else {
        commentMap.set(commentAuthor.login, {
          login: commentAuthor.login,
          avatarUrl: commentAuthor.avatarUrl,
          score: 1,
        });
      }
    }
  }

  const sortDesc = (a: LeaderboardUser, b: LeaderboardUser) => b.score - a.score;

  return {
    thumbsUpKing: Array.from(thumbsUpMap.values()).sort(sortDesc),
    commentKing: Array.from(commentMap.values()).sort(sortDesc),
    ideaKing: Array.from(ideaMap.values()).sort(sortDesc),
  };
}

export function useLeaderboard() {
  const { token } = useAuth();

  return useQuery<LeaderboardData>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const data = await graphqlRequest<AllDiscussionsResponse>(
        ALL_DISCUSSIONS_QUERY,
        { owner: OWNER, repo: REPO },
        { token },
      );
      return processLeaderboardData(data);
    },
    staleTime: 60000,
  });
}
