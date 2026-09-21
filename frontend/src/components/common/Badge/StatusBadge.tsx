import React from 'react';
import { BookingStatus } from '@/types/booking';
import { getStatusBadgeConfig } from '@/utils/statusPredicates';

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

/**
 * Huy hiệu trạng thái với màu sắc nhận diện trực quan
 * Sử dụng icon thư viện Material Symbols Outlined
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { label, variant } = getStatusBadgeConfig(status);

  let iconName = 'hourglass_top';
  if (variant === 'confirmed') iconName = 'check_circle';
  if (variant === 'completed') iconName = 'verified';
  if (variant === 'cancelled') iconName = 'cancel';

  return (
    <span className={`badge badge-${variant} ${className}`}>
      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
        {iconName}
      </span>
      <span>{label}</span>
    </span>
  );
}
