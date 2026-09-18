'use client';

import React from 'react';
import Link from 'next/link';
import { Modal } from '@/components/common/Modal/Modal';
import { LoginForm } from '@/features/auth/LoginForm';

interface BookingLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingLoginModal({ isOpen, onClose, onSuccess }: BookingLoginModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đăng Nhập Để Tiếp Tục Đặt Lịch"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Banner hướng dẫn thân thiện */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-surface-low, #f1f5f9)',
            borderLeft: '4px solid var(--color-primary, #006c49)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.9rem',
            color: 'var(--color-text-main, #1e293b)',
            lineHeight: 1.5,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary, #006c49)', flexShrink: 0, marginTop: '2px' }}>
            info
          </span>
          <div>
            Quý khách vui lòng đăng nhập để hệ thống lưu thông tin và xác nhận lịch hẹn. Toàn bộ dịch vụ và khung giờ quý khách vừa chọn sẽ được <strong>giữ nguyên vẹn</strong>.
          </div>
        </div>

        {/* Tái sử dụng LoginForm component dùng chung */}
        <LoginForm
          onSuccess={onSuccess}
          redirectOnSuccess={false}
          compact={true}
        />

        {/* Footer link */}
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
          Chưa có tài khoản?{' '}
          <Link
            href="/register?callbackUrl=/booking"
            style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'underline' }}
          >
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </Modal>
  );
}
