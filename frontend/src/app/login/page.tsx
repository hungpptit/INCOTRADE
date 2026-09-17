'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { authService } from '@/services/authService';
import { Button } from '@/components/common/Button/Button';
import { ErrorAlert, LoadingSkeleton } from '@/components/common/Feedback/StateFeedback';

// Zod Schema Validate (Rule 3)
const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập địa chỉ Email.').email('Địa chỉ Email không đúng định dạng.'),
  password: z.string().min(6, 'Mật khẩu phải có tối thiểu 6 ký tự.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
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
      // Chuyển hướng theo role hoặc callback
      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (response.user.role === 'Admin') {
        router.push('/admin/bookings');
      } else {
        router.push('/services');
      }
      router.refresh();
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        minHeight: '75vh',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)',
        margin: '16px 0',
      }}
      className="login-split-container"
    >
      {/* Left Column: Luxurious Visual Showcase (Desktop only) */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        className="login-visual-panel"
      >
        <div style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
          <Image
            src="/images/salon-bg.png"
            alt="Salon Background"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div
              style={{
                position: 'relative',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Image src="/images/logo.png" alt="Aura Logo" fill style={{ objectFit: 'contain' }} />
            </div>
            <div>
              <h2 style={{ color: '#ffffff', fontSize: '1.6rem', lineHeight: 1.1 }}>AURA WELLNESS</h2>
              <span style={{ color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.08em' }}>
                GROOMING & SANCTUARY
              </span>
            </div>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '1.15rem', lineHeight: 1.6, maxWidth: '420px' }}>
            Chào mừng Quý khách đến với hệ thống đặt lịch chăm sóc chuyên nghiệp. Thao tác tiện lợi, khung giờ chính xác, phục vụ tận tâm.
          </p>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            backgroundColor: 'rgba(11, 28, 48, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ color: '#e2e8f0', fontSize: '0.98rem', fontStyle: 'italic', marginBottom: '8px' }}>
            &ldquo;Đơn giản hóa trải nghiệm đặt lịch cho mọi khách hàng — Chạm là đặt, an tâm tận hưởng dịch vụ.&rdquo;
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Ban điều hành Aura Wellness</div>
        </div>
      </div>

      {/* Right Column: Clean, Senior-Friendly Login Form */}
      <div
        style={{
          padding: '40px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: '520px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '8px' }}>
            Đăng nhập hệ thống
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>
            Vui lòng nhập thông tin hoặc bấm chọn nhanh tài khoản mẫu bên dưới.
          </p>
        </div>

        {/* 1-Tap Quick Fill Demo Cards (Cho người trung niên / kiểm thử nhanh) */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1.5px dashed var(--color-border-hover)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '10px',
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('customer1@gmail.com')}
              className="btn btn-outline"
              disabled={isLoading}
              style={{
                minHeight: '44px',
                fontSize: '0.92rem',
                padding: '8px 12px',
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
                minHeight: '44px',
                fontSize: '0.92rem',
                padding: '8px 12px',
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

            <button
              type="button"
              onClick={() => handleQuickFill('admin@booking.com')}
              className="btn btn-secondary"
              disabled={isLoading}
              style={{
                minHeight: '44px',
                fontSize: '0.92rem',
                padding: '8px 12px',
                justifyContent: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>admin_panel_settings</span>
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && <ErrorAlert message={errorMessage} />}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Địa chỉ Email <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="ví dụ: customer1@gmail.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.9rem', marginTop: '2px' }}>
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">
              Mật khẩu <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.9rem', marginTop: '2px' }}>
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
            style={{ width: '100%', minHeight: '52px', fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Đăng Nhập Vào Hệ Thống</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
          </Button>
        </form>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .login-split-container {
            grid-template-columns: 1fr 1.15fr !important;
          }
        }
        @media (max-width: 899px) {
          .login-visual-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSkeleton count={2} />}>
      <LoginForm />
    </Suspense>
  );
}

