'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function ServiceSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Reset về trang 1 khi tìm kiếm

    startTransition(() => {
      router.push(`/services?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setQuery('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.set('page', '1');
    startTransition(() => {
      router.push(`/services?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '580px' }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          type="text"
          className="form-input"
          placeholder="Tìm tên dịch vụ (ví dụ: Cắt tóc, Cạo râu, Massage...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingLeft: '40px', minHeight: '48px', fontSize: '1.02rem' }}
        />
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '20px',
            color: 'var(--color-text-subtle)',
            pointerEvents: 'none',
          }}
        >
          search
        </span>
        {query && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Xóa tìm kiếm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              close
            </span>
          </button>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-secondary"
        disabled={isPending}
        style={{ minWidth: '110px', minHeight: '48px' }}
      >
        {isPending ? 'Đang lọc...' : 'Tìm kiếm'}
      </button>
    </form>
  );
}
