import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware phân quyền Route Guarding (Rule 7)
 * Bảo vệ tất cả các đường dẫn /admin/*
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kiểm tra nếu route bắt đầu bằng /admin
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('aura_token')?.value;
    const role = request.cookies.get('aura_role')?.value;

    // 1. Nếu chưa đăng nhập -> Chuyển hướng sang trang /login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Nếu đã đăng nhập nhưng không phải Admin -> Chặn và chuyển hướng về /services
    if (role !== 'Admin') {
      return NextResponse.redirect(new URL('/services', request.url));
    }
  }

  // Cho phép tiếp tục nếu hợp lệ
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
