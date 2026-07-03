import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginButton from './LoginButton';

const mockLogin = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe('LoginButton', () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  it('"GitHub로 로그인" 텍스트로 렌더링된다', () => {
    render(<LoginButton />);

    expect(screen.getByText('GitHub로 로그인')).toBeInTheDocument();
  });

  it('클릭 시 login()을 호출한다', async () => {
    const user = userEvent.setup();
    render(<LoginButton />);

    await user.click(screen.getByRole('button', { name: /GitHub로 로그인/ }));

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('returnPath를 전달하면 login에 해당 경로를 넘긴다', async () => {
    const user = userEvent.setup();
    render(<LoginButton returnPath="/chapters/123" />);

    await user.click(screen.getByRole('button', { name: /GitHub로 로그인/ }));

    expect(mockLogin).toHaveBeenCalledWith('/chapters/123');
  });
});
