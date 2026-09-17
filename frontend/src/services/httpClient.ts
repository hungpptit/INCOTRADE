import { ProblemDetails } from '@/types/common';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export class ApiError extends Error {
  status: number;
  problemDetails?: ProblemDetails;

  constructor(status: number, message: string, problemDetails?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problemDetails = problemDetails;
  }
}

/**
 * Lấy token xác thực từ Cookie hoặc LocalStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // 1. Kiểm tra cookie
  const match = document.cookie.match(new RegExp('(^| )aura_token=([^;]+)'));
  if (match) return decodeURIComponent(match[2]);
  
  // 2. Fallback localStorage
  return localStorage.getItem('aura_token');
}

/**
 * Lưu token đồng bộ vào cả Cookie và LocalStorage
 */
export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  
  if (token) {
    // Lưu cookie trong 7 ngày
    const maxAge = 7 * 24 * 60 * 60;
    document.cookie = `aura_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    localStorage.setItem('aura_token', token);
  } else {
    document.cookie = 'aura_token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'aura_role=; path=/; max-age=0; SameSite=Lax';
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
  }
}

/**
 * HTTP Client trung tâm thực thi request và bắt lỗi chuẩn ProblemDetails
 */
export async function httpClient<T>(
  endpoint: string,
  options: RequestInit = {},
  customToken?: string | null
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = customToken !== undefined ? customToken : getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetails: ProblemDetails | undefined;
      let errorMessage = `Yêu cầu thất bại (Mã lỗi ${response.status})`;

      try {
        errorDetails = await response.json();
        if (errorDetails?.detail) {
          errorMessage = errorDetails.detail;
        } else if (errorDetails?.title) {
          errorMessage = errorDetails.title;
        }
      } catch {
        // Phản hồi không phải JSON
      }

      // Phân loại mã lỗi theo quy tắc Rule 2
      if (response.status === 409) {
        errorMessage = errorDetails?.detail || 'Khung giờ này vừa có người đặt trước. Quý khách vui lòng chọn khung giờ khác.';
      } else if (response.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
      } else if (response.status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
      } else if (response.status === 404) {
        errorMessage = errorDetails?.detail || 'Không tìm thấy dữ liệu yêu cầu.';
      } else if (response.status === 400) {
        errorMessage = errorDetails?.detail || 'Dữ liệu gửi lên không hợp lệ.';
      }

      throw new ApiError(response.status, errorMessage, errorDetails);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, 'Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại đường truyền mạng.');
  }
}
