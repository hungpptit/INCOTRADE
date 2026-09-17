'use client';

import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'danger-outline';
  size?: 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * Component Button chuẩn toàn hệ thống
 * Tự động khóa và hiển thị spinner khi isLoading={true} để chống Double-Submit (Rule 5)
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'lg' ? 'btn-lg' : '';

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="spinner" aria-hidden="true" />
          <span>{loadingText || 'Đang xử lý...'}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
