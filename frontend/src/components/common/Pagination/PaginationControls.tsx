'use client';

import React from 'react';
import { Button } from '../Button/Button';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * Điều hướng phân trang Server-side (Database Pagination)
 */
export function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  isLoading = false,
}: PaginationControlsProps) {
  if (totalPages <= 1 && totalCount <= 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '16px 0',
        borderTop: '1px solid var(--color-border)',
        marginTop: '20px',
      }}
    >
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
        Hiển thị trang <strong style={{ color: 'var(--color-primary)' }}>{currentPage}</strong> /{' '}
        <strong>{totalPages || 1}</strong> (Tổng cộng <strong>{totalCount}</strong> mục)
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          variant="outline"
          size="md"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
          <span>Trang trước</span>
        </Button>
        <Button
          variant="outline"
          size="md"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <span>Trang sau</span>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
        </Button>
      </div>
    </div>
  );
}
