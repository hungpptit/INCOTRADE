'use client';

import React, { Suspense } from 'react';
import Image from 'next/image';
import { LoadingSkeleton } from '@/components/common/Feedback/StateFeedback';
import { LoginForm } from '@/features/auth/LoginForm';

function LoginPageContent() {
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
                GROOMING &amp; SANCTUARY
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

      {/* Right Column: Tái sử dụng component LoginForm dùng chung */}
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
        <LoginForm redirectOnSuccess={true} compact={false} />
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
      <LoginPageContent />
    </Suspense>
  );
}
