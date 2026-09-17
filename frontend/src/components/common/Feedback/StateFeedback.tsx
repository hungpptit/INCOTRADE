import React, { ReactNode } from 'react';
import { Button } from '../Button/Button';

// 1. Loading Skeleton
export function LoadingSkeleton({
  count = 3,
  type = 'card',
}: {
  count?: number;
  type?: 'card' | 'table-row';
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aura-card"
          style={{
            minHeight: type === 'card' ? '120px' : '56px',
            backgroundColor: '#f1f5f9',
            animation: 'pulse 1.5s infinite ease-in-out',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}

// 2. Error Alert
export function ErrorAlert({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        backgroundColor: '#fef2f2',
        border: '1.5px solid var(--color-error)',
        borderRadius: '12px',
        padding: '16px 20px',
        color: 'var(--color-error)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        margin: '16px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--color-error)' }}>
          error
        </span>
        <div style={{ fontSize: '1rem', fontWeight: 600 }}>{message}</div>
      </div>
      {onRetry && (
        <Button variant="danger" size="md" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

// 3. Conflict Alert (HTTP 409 Conflict - Điểm cộng riêng trong đề bài & chuẩn Stitch UI)
export function ConflictAlert({
  message,
  onSelectAnother,
}: {
  message?: string;
  onSelectAnother?: () => void;
}) {
  return (
    <div className="conflict-banner" id="conflict-banner">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div className="conflict-banner-icon">
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
            warning
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="conflict-banner-title">
              HTTP 409 Conflict • Phát Hiện Trùng Lịch
            </span>
            <span className="conflict-collision-tag">
              Live State Collision
            </span>
          </div>
          <p className="conflict-banner-desc">
            {message ||
              'Khung giờ này vừa có khách hàng khác xác nhận trước. Quý khách vui lòng chọn một khung giờ khác còn trống.'}
          </p>
        </div>
      </div>
      {onSelectAnother && (
        <div style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onSelectAnother}
            style={{
              borderColor: 'var(--color-error)',
              color: 'var(--color-error)',
              backgroundColor: '#ffffff',
              fontSize: '0.88rem',
              padding: '6px 14px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              refresh
            </span>
            Chọn khung giờ khác
          </button>
        </div>
      )}
    </div>
  );
}

// 4. Empty State
export function EmptyState({
  icon = 'event_busy',
  title = 'Chưa có dữ liệu',
  description = 'Hiện tại chưa có thông tin nào được hiển thị.',
  action,
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="aura-card"
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        margin: '24px 0',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-surface-low)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
          {icon}
        </span>
      </div>
      <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>{title}</h3>
      <p style={{ maxWidth: '460px', margin: '0 auto', fontSize: '0.96rem' }}>
        {description}
      </p>
      {action && <div style={{ marginTop: '12px' }}>{action}</div>}
    </div>
  );
}

