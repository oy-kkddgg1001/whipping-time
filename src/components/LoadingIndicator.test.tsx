import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { toHaveNoViolations } from 'vitest-axe/matchers';
import LoadingIndicator from './LoadingIndicator';

expect.extend({ toHaveNoViolations });

describe('LoadingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기 렌더링 시 표시되지 않는다 (300ms 이전)', () => {
    render(<LoadingIndicator />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('300ms 지연 후 렌더링된다', () => {
    render(<LoadingIndicator />);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('커스텀 delay를 사용할 수 있다', () => {
    render(<LoadingIndicator delay={500} />);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('접근성 위반이 없어야 한다', async () => {
    vi.useRealTimers();

    const { container } = render(<LoadingIndicator delay={0} />);

    // Wait for the component to become visible with delay=0
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(screen.getByRole('status')).toBeInTheDocument();

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
