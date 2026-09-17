'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PaginationControls } from '@/components/common/Pagination/PaginationControls';

interface Props {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function ServicePaginationClient({ currentPage, totalPages, totalCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/services?${params.toString()}`);
  };

  return (
    <PaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={totalCount}
      onPageChange={handlePageChange}
    />
  );
}
