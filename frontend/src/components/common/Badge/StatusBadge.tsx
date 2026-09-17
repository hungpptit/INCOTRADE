import React from 'react';
import { BookingStatus } from '@/types/booking';
import { getStatusBadgeConfig } from '@/utils/statusPredicates';

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

/**
 * Huy hiệu trạng thái chuẩn nhận diện màu sắc rõ ràng (Rule 6)
 * Sử dụng icon thư viện Material Symbols Outlined sang trọng
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
