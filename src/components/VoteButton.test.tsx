import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { VoteButton } from './VoteButton';

const defaultProps = {
  count: 5,
  hasVoted: false,
  isAuthenticated: true,
  isLoading: false,
  onClick: vi.fn(),
  topicTitle: 'React Server Components',
};

describe('VoteButton', () => {
  it('투표 수를 렌더링한다', () => {
    render(<VoteButton {...defaultProps} count={10} />);

    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('hasVoted=true일 때 투표 완료 시각 상태를 표시한다', () => {
    render(<VoteButton {...defaultProps} hasVoted={true} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('hasVoted=false일 때 투표 전 상태를 표시한다', () => {
    render(<VoteButton {...defaultProps} hasVoted={false} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('인증된 상태에서 클릭 시 onClick을 호출한다', () => {
    const onClick = vi.fn();
    render(
      <VoteButton {...defaultProps} isAuthenticated={true} onClick={onClick} />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('비로그인 상태에서 클릭 시 onClick을 호출하지 않고 로그인 메시지를 표시한다', () => {
    const onClick = vi.fn();
    render(
      <VoteButton
        {...defaultProps}
        isAuthenticated={false}
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument();
  });

  it('isLoading=true일 때 버튼이 비활성화된다', () => {
    render(<VoteButton {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('hasVoted=false일 때 올바른 aria-label을 갖는다', () => {
    render(
      <VoteButton {...defaultProps} hasVoted={false} topicTitle="TypeScript 5.0" />,
    );

    expect(
      screen.getByLabelText('TypeScript 5.0에 투표하기'),
    ).toBeInTheDocument();
  });

  it('hasVoted=true일 때 올바른 aria-label을 갖는다', () => {
    render(
      <VoteButton {...defaultProps} hasVoted={true} topicTitle="TypeScript 5.0" />,
    );

    expect(
      screen.getByLabelText('TypeScript 5.0 투표 취소하기'),
    ).toBeInTheDocument();
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(<VoteButton {...defaultProps} />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('hasVoted=true 상태에서 접근성 위반이 없다', async () => {
    const { container } = render(
      <VoteButton {...defaultProps} hasVoted={true} />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('비로그인 상태에서 로그인 메시지 표시 시 접근성 위반이 없다', async () => {
    const { container } = render(
      <VoteButton {...defaultProps} isAuthenticated={false} />,
    );

    // Trigger login message
    fireEvent.click(screen.getByRole('button'));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
