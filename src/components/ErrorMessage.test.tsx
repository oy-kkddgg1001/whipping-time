import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { toHaveNoViolations } from 'vitest-axe/matchers';
import ErrorMessage from './ErrorMessage';

expect.extend({ toHaveNoViolations });

describe('ErrorMessage', () => {
  it('에러 메시지 텍스트를 렌더링한다', () => {
    render(<ErrorMessage message="데이터를 불러올 수 없습니다" />);

    expect(screen.getByText('데이터를 불러올 수 없습니다')).toBeInTheDocument();
  });

  it('onRetry가 제공되면 재시도 버튼을 표시한다', () => {
    render(<ErrorMessage message="에러 발생" onRetry={() => {}} />);

    expect(screen.getByRole('button', { name: /다시 시도/ })).toBeInTheDocument();
  });

  it('onRetry가 없으면 재시도 버튼을 표시하지 않는다', () => {
    render(<ErrorMessage message="에러 발생" />);

    expect(screen.queryByRole('button', { name: /다시 시도/ })).not.toBeInTheDocument();
  });

  it('재시도 버튼 클릭 시 onRetry를 호출한다', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(<ErrorMessage message="에러 발생" onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: /다시 시도/ }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('접근성 위반이 없어야 한다', async () => {
    const { container } = render(
      <ErrorMessage message="에러 발생" onRetry={() => {}} />
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
