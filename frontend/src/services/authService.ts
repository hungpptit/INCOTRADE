import { httpClient, setAuthToken } from './httpClient';
import { LoginRequest, LoginResponse, User } from '@/types/auth';

export const authService = {
  /**
   * Đăng nhập tài khoản, lưu Token và Role vào Cookie & LocalStorage
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const data = await httpClient<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (data.token) {
      setAuthToken(data.token);
      if (typeof window !== 'undefined') {
        const maxAge = 7 * 24 * 60 * 60;
        document.cookie = `aura_role=${encodeURIComponent(data.user.role)}; path=/; max-age=${maxAge}; SameSite=Lax`;
        localStorage.setItem('aura_user', JSON.stringify(data.user));
      }
    }

    return data;
  },

  /**
   * Lấy thông tin user hiện tại qua Token
   */
  async getMe(token?: string): Promise<User> {
    return httpClient<User>('/api/auth/me', {}, token);
  },

  /**
   * Đăng xuất, xóa toàn bộ session, cookie và local storage
   */
  logout(): void {
    setAuthToken(null);
  },

  /**
   * Lấy thông tin user đã lưu ở client
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userJson = localStorage.getItem('aura_user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  },
};
