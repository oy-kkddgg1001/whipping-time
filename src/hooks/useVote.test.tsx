import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVote } from './useVote';

// Mock useGraphQL
const mockMutate = vi.fn().mockResolvedValue({});
vi.mock('./useGraphQL', () => ({
  useGraphQL: () => ({ query: vi.fn(), mutate: mockMutate }),
}));

describe('useVote', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockMutate.mockResolvedValue({});
  });

  it('초기 상태가 제공된 값과 일치한다', () => {
    const { result } = renderHook(() => useVote('disc-1', 5, false));

    expect(result.current.hasVoted).toBe(false);
    expect(result.current.voteCount).toBe(5);
    expect(result.current.isLoading).toBe(false);
  });

  it('초기 hasVoted=true 상태를 올바르게 반영한다', () => {
    const { result } = renderHook(() => useVote('disc-1', 3, true));

    expect(result.current.hasVoted).toBe(true);
    expect(result.current.voteCount).toBe(3);
  });

  it('hasVoted=false일 때 toggleVote 시 count+1, hasVoted=true가 된다', async () => {
    const { result } = renderHook(() => useVote('disc-1', 5, false));

    await act(async () => {
      await result.current.toggleVote();
    });

    expect(result.current.hasVoted).toBe(true);
    expect(result.current.voteCount).toBe(6);
  });

  it('hasVoted=true일 때 toggleVote 시 count-1, hasVoted=false가 된다', async () => {
    const { result } = renderHook(() => useVote('disc-1', 5, true));

    await act(async () => {
      await result.current.toggleVote();
    });

    expect(result.current.hasVoted).toBe(false);
    expect(result.current.voteCount).toBe(4);
  });

  it('mutation 실패 시 원래 값으로 롤백된다', async () => {
    mockMutate.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useVote('disc-1', 5, false));

    await act(async () => {
      await result.current.toggleVote();
    });

    // 롤백: 원래 상태로 복원
    expect(result.current.hasVoted).toBe(false);
    expect(result.current.voteCount).toBe(5);
    expect(result.current.isLoading).toBe(false);
  });

  it('hasVoted=true에서 mutation 실패 시 원래 값으로 롤백된다', async () => {
    mockMutate.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useVote('disc-1', 3, true));

    await act(async () => {
      await result.current.toggleVote();
    });

    // 롤백: 원래 상태로 복원
    expect(result.current.hasVoted).toBe(true);
    expect(result.current.voteCount).toBe(3);
  });

  it('mutation 진행 중 isLoading이 true이다', async () => {
    let resolvePromise: (value: unknown) => void;
    mockMutate.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useVote('disc-1', 5, false));

    // Start the toggle but don't await completion
    act(() => {
      result.current.toggleVote();
    });

    // isLoading should be true while mutation is in progress
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve the mutation
    await act(async () => {
      resolvePromise!({});
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('isLoading=true일 때 중복 toggleVote 호출을 무시한다 (중복 투표 방지)', async () => {
    let resolvePromise: (value: unknown) => void;
    mockMutate.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useVote('disc-1', 5, false));

    // Start first toggle
    act(() => {
      result.current.toggleVote();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Try to toggle again while loading — should be ignored
    await act(async () => {
      await result.current.toggleVote();
    });

    // mutate should only have been called once
    expect(mockMutate).toHaveBeenCalledTimes(1);

    // Resolve the original mutation
    await act(async () => {
      resolvePromise!({});
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.voteCount).toBe(6);
  });

  it('투표 추가 시 AddReaction mutation을 호출한다', async () => {
    const { result } = renderHook(() => useVote('disc-123', 2, false));

    await act(async () => {
      await result.current.toggleVote();
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.stringContaining('AddReaction'),
      { subjectId: 'disc-123', content: 'THUMBS_UP' },
    );
  });

  it('투표 취소 시 RemoveReaction mutation을 호출한다', async () => {
    const { result } = renderHook(() => useVote('disc-123', 2, true));

    await act(async () => {
      await result.current.toggleVote();
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.stringContaining('RemoveReaction'),
      { subjectId: 'disc-123', content: 'THUMBS_UP' },
    );
  });
});
