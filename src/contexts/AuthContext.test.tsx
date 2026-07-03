import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  describe('초기 상태', () => {
    it('user=null, token=null, isAuthenticated=false', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('setAuthData', () => {
    it('user와 token을 설정하고 isAuthenticated가 true가 된다', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.setAuthData('test-token-123', {
          login: 'testuser',
          avatarUrl: 'https://avatar.example.com/1',
          id: 'U_node123',
        });
      });

      expect(result.current.token).toBe('test-token-123');
      expect(result.current.user).toEqual({
        login: 'testuser',
        avatarUrl: 'https://avatar.example.com/1',
        id: 'U_node123',
      });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('user와 token을 초기화하고 isAuthenticated가 false가 된다', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // First, set auth data
      act(() => {
        result.current.setAuthData('test-token-123', {
          login: 'testuser',
          avatarUrl: 'https://avatar.example.com/1',
          id: 'U_node123',
        });
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('useAuth outside AuthProvider', () => {
    it('AuthProvider 외부에서 사용하면 에러를 던진다', () => {
      // Suppress error output in test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
