import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { TopicFilter } from './TopicFilter';

describe('TopicFilter', () => {
  it('모든 필터 버튼을 렌더링한다 ("전체", "고민상담", "떠먹여 드림", "떠먹여 주세요")', () => {
    render(<TopicFilter selectedType="all" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '고민상담' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '떠먹여 드림' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '떠먹여 주세요' })).toBeInTheDocument();
  });

  it('선택된 필터 버튼에 aria-pressed="true"가 설정된다', () => {
    render(<TopicFilter selectedType="고민상담" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: '고민상담' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '떠먹여 드림' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '떠먹여 주세요' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('필터 버튼 클릭 시 onChange에 해당 타입을 전달한다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TopicFilter selectedType="all" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '떠먹여 드림' }));
    expect(onChange).toHaveBeenCalledWith('떠먹여 드림');

    await user.click(screen.getByRole('button', { name: '전체' }));
    expect(onChange).toHaveBeenCalledWith('all');
  });

  it('isEmpty=true일 때 빈 결과 메시지를 표시한다', () => {
    render(<TopicFilter selectedType="고민상담" onChange={() => {}} isEmpty={true} />);

    expect(screen.getByText('선택한 유형의 주제가 없습니다.')).toBeInTheDocument();
  });

  it('isEmpty=false일 때 빈 결과 메시지를 표시하지 않는다', () => {
    render(<TopicFilter selectedType="all" onChange={() => {}} isEmpty={false} />);

    expect(screen.queryByText('선택한 유형의 주제가 없습니다.')).not.toBeInTheDocument();
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(
      <TopicFilter selectedType="all" onChange={() => {}} />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('isEmpty=true 상태에서도 접근성 위반이 없다', async () => {
    const { container } = render(
      <TopicFilter selectedType="떠먹여 주세요" onChange={() => {}} isEmpty={true} />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
