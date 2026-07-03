import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../utils/graphql-client';

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    login: string;
    avatarUrl: string;
  };
}

interface CommentsResponse {
  node: {
    comments: {
      nodes: Comment[];
    };
  };
}

interface AddCommentResponse {
  addDiscussionComment: {
    comment: Comment;
  };
}

const GET_COMMENTS_QUERY = `
  query GetComments($discussionId: ID!) {
    node(id: $discussionId) {
      ... on Discussion {
        comments(first: 50) {
          nodes {
            id
            body
            createdAt
            author {
              login
              avatarUrl
            }
          }
        }
      }
    }
  }
`;

const ADD_COMMENT_MUTATION = `
  mutation AddDiscussionComment($discussionId: ID!, $body: String!) {
    addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
      comment {
        id
        body
        createdAt
        author {
          login
          avatarUrl
        }
      }
    }
  }
`;

export function useComments(discussionId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ['comments', discussionId],
    queryFn: async () => {
      const data = await graphqlRequest<CommentsResponse>(
        GET_COMMENTS_QUERY,
        { discussionId },
        { token },
      );
      return data.node.comments.nodes;
    },
    enabled: !!discussionId,
    refetchInterval: 30000,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (body: string) => {
      const data = await graphqlRequest<AddCommentResponse>(
        ADD_COMMENT_MUTATION,
        { discussionId, body },
        { token },
      );
      return data.addDiscussionComment.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', discussionId] });
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    isLoading: commentsQuery.isLoading,
    error: commentsQuery.error,
    addComment: addCommentMutation.mutateAsync,
    isAddingComment: addCommentMutation.isPending,
  };
}
