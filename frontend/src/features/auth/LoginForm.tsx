'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { authService } from '@/services/authService';
import { Button } from '@/components/common/Button/Button';
import { ErrorAlert } from '@/components/common/Feedback/StateFeedback';

// Schema kiểm tra hợp lệ dữ liệu đăng nhập bằng Zod
const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập địa chỉ Email.').email('Địa chỉ Email không đúng định dạng.'),
  password: z.string().min(6, 'Mật khẩu phải có tối thiểu 6 ký tự.'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export interface LoginFormProps {
  onSuccess?: () => void;
  redirectOnSuccess?: boolean;
  compact?: boolean;
  showDemoAccounts?: boolean;
}

export function LoginForm({
  onSuccess,
  redirectOnSuccess = true,
  compact = false,
  showDemoAccounts = true,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const executeLogin = async (data: LoginFormData) => {
    // Validate bằng Zod ở Client trước khi gửi
    const validation = loginSchema.safeParse(data);
    if (!validation.success) {
      const errors: Partial<Record<keyof LoginFormData, string>> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof LoginFormData;
        errors[path] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authService.login(data);

      if (onSuccess) {
        onSuccess();
        return;
      }

      if (redirectOnSuccess) {
        // Chuyển hướng theo role hoặc callback
        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (response.user.role === 'Admin') {
          router.push('/admin/bookings');
        } else {
          const hasDraft = typeof window !== 'undefined' && sessionStorage.getItem('aura_draft_booking');
          if (hasDraft) {
            router.push('/booking');
          } else {
            router.push('/services');
          }
        }
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(formData);
  };

  // 1-Click Quick Login Demo Handlers
  const handleQuickFill = (email: string) => {
    const data: LoginFormData = { email, password: 'Demo@123456' };
    setFormData(data);
    setFieldErrors({});
    executeLogin(data);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: compact ? '16px' : '20px' }}>
      {!compact && (
        <div style={{ marginBottom: '8px' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '8px' }}>
            Đăng nhập hệ thống
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>
            Vui lòng nhập thông tin hoặc bấm chọn nhanh tài khoản mẫu bên dưới.
          </p>
        </div>
      )}

      {/* 1-Tap Quick Fill Demo Cards (Cho người trung niên / kiểm thử nhanh) */}
      {showDemoAccounts && (
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1.5px dashed var(--color-border-hover, #cbd5e1)',
            borderRadius: '12px',
            padding: compact ? '12px' : '16px',
          }}
        >
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-secondary)' }}>
              flash_on
            </span>
            <span>Tài khoản thử nghiệm nhanh (1 chạm):</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('customer1@gmail.com')}
              className="btn btn-outline"
              disabled={isLoading}
              style={{
                minHeight: '40px',
                fontSize: '0.88rem',
                padding: '6px 10px',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                borderColor: '#cbd5e1',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
              <span>Khách 1</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('customer2@gmail.com')}
              className="btn btn-outline"
              disabled={isLoading}
              style={{
                minHeight: '40px',
                fontSize: '0.88rem',
                padding: '6px 10px',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                borderColor: '#cbd5e1',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
              <span>Khách 2</span>
            </button>

            {!compact && (
              <button
                type="button"
                onClick={() => handleQuickFill('admin@booking.com')}
                className="btn btn-secondary"
                disabled={isLoading}
                style={{
                  minHeight: '40px',
                  fontSize: '0.88rem',
                  padding: '6px 10px',
                  justifyContent: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>admin_panel_settings</span>
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {errorMessage && <ErrorAlert message={errorMessage} />}

      {/* Login Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="login-email">
            Địa chỉ Email <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <input
            id="login-email"
            type="email"
            className="form-input"
            placeholder="ví dụ: customer1@gmail.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={isLoading}
            autoComplete="email"
            style={{ width: '100%' }}
          />
          {fieldErrors.email && (
            <span style={{ color: 'var(--color-error)', fontSize: '0.88rem', marginTop: '2px', display: 'block' }}>
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: '4px' }}>
          <label className="form-label" htmlFor="login-password">
            Mật khẩu <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <input
            id="login-password"
            type="password"
            className="form-input"
            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
            style={{ width: '100%' }}
          />
          {fieldErrors.password && (
            <span style={{ color: 'var(--color-error)', fontSize: '0.88rem', marginTop: '2px', display: 'block' }}>
              {fieldErrors.password}
            </span>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          loadingText="Đang xác thực..."
          style={{ width: '100%', minHeight: compact ? '46px' : '52px', fontSize: '1.02rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <span>{compact ? 'Đăng Nhập & Tiếp Tục Đặt Lịch' : 'Đăng Nhập Vào Hệ Thống'}</span>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
        </Button>
      </form>
    </div>
  );
}
