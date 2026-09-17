import React, { Suspense } from 'react';
import Link from 'next/link';
import { serviceService } from '@/services/serviceService';
import { formatCurrency, formatDuration } from '@/utils/formatters';
import { ServiceSearchBar } from '@/features/services/ServiceSearchBar';
import { ServicePaginationClient } from '@/features/services/ServicePaginationClient';
import { EmptyState, ErrorAlert } from '@/components/common/Feedback/StateFeedback';

export const dynamic = 'force-dynamic';

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.search || '';
  const pageSize = 6;

  let servicesResult;
  let errorMessage: string | null = null;

  try {
    servicesResult = await serviceService.getAll({
      page,
      pageSize,
      search,
      isActive: true, // Khách hàng chỉ xem dịch vụ đang hoạt động
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage = err.message;
    } else {
      errorMessage = 'Không thể tải danh sách dịch vụ từ máy chủ.';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Subheader Status Bar (Stitch Design) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-surface-low)',
          fontSize: '0.82rem',
          color: 'var(--color-text-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Trải nghiệm Khách hàng</span>
          <span style={{ color: 'var(--color-outline-variant)' }}>/</span>
          <strong style={{ color: 'var(--color-text-main)' }}>Bảng Danh Mục Dịch Vụ</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-secondary)',
              boxShadow: '0 0 0 2px rgba(0, 108, 73, 0.2)',
            }}
          />
          <strong style={{ color: 'var(--color-text-main)' }}>
            Studio Đang Mở Cửa • Phục Vụ Trọn Gói
          </strong>
        </div>
      </div>

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-secondary)',
              display: 'inline-block',
              marginBottom: '4px',
            }}
          >
            Aura Grooming & Wellness Catalog
          </span>
          <h1 style={{ color: 'var(--color-primary)' }}>Bảng Dịch Vụ Chăm Sóc & Thư Giãn</h1>
          <p style={{ maxWidth: '680px', fontSize: '1rem', marginTop: '4px' }}>
            Lựa chọn các gói dịch vụ chất lượng cao được thiết kế riêng cho sự thư giãn và phong cách của bạn.
            Bấm nút <strong>&ldquo;Đặt lịch ngay&rdquo;</strong> để giữ chỗ với khung giờ phù hợp nhất.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: '8px' }}>
          <Suspense fallback={<div style={{ height: '48px' }} />}>
            <ServiceSearchBar />
          </Suspense>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && <ErrorAlert message={errorMessage} />}

      {/* Content State */}
      {servicesResult && (
        <>
          {servicesResult.items.length === 0 ? (
            <EmptyState
              icon="content_cut"
              title="Không tìm thấy dịch vụ nào"
              description={
                search
                  ? `Không có kết quả nào khớp với từ khóa "${search}". Quý khách vui lòng thử tìm từ khóa khác.`
                  : 'Hiện tại chưa có dịch vụ nào đang hoạt động.'
              }
              action={
                search ? (
                  <Link href="/services" className="btn btn-outline">
                    Xem tất cả dịch vụ
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              {/* Service Cards Grid - Stitch Luxury Cards */}
              <div className="grid-3">
                {servicesResult.items.map((service, idx) => {
                  const isFeatured = idx === 0;
                  const categoryTag = isFeatured ? 'Được ưa chuộng nhất' : 'Dịch vụ tiêu chuẩn';

                  return (
                    <div
                      key={service.id}
                      className="aura-card aura-card-interactive"
                      style={{
                        padding: '24px',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '270px',
                        position: 'relative',
                        backgroundColor: 'var(--color-surface-lowest)',
                      }}
                    >
                      {/* Top Row: Category Tag & Duration Chip */}
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: isFeatured ? 'var(--color-secondary)' : '#94a3b8',
                              }}
                            />
                            <span
                              style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                color: isFeatured ? 'var(--color-secondary)' : 'var(--color-text-subtle)',
                              }}
                            >
                              {categoryTag}
                            </span>
                          </div>

                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: 'var(--color-text-subtle)',
                              backgroundColor: 'var(--color-surface-low)',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                              schedule
                            </span>
                            <span>{formatDuration(service.durationMinutes)}</span>
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          style={{
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            lineHeight: 1.35,
                            marginBottom: '8px',
                          }}
                        >
                          {service.name}
                        </h3>

                        {/* Description */}
                        <p
                          style={{
                            fontSize: '0.88rem',
                            color: 'var(--color-text-subtle)',
                            lineHeight: 1.5,
                            marginBottom: '20px',
                          }}
                        >
                          {service.description || 'Dịch vụ chăm sóc chuyên sâu theo tiêu chuẩn chuẩn mực tại Aura Sanctuary.'}
                        </p>
                      </div>

                      {/* Bottom Footer: Price & CTA Action */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                          paddingTop: '16px',
                          marginTop: 'auto',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            GIÁ DỊCH VỤ
                          </div>
                          <div
                            style={{
                              fontSize: '1.35rem',
                              fontWeight: 800,
                              color: 'var(--color-secondary)',
                            }}
                          >
                            {formatCurrency(service.price)}
                          </div>
                        </div>

                        <Link
                          href={`/booking?serviceId=${service.id}`}
                          className="btn btn-primary"
                          style={{
                            padding: '10px 18px',
                            fontSize: '0.92rem',
                            borderRadius: 'var(--radius-md)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>Đặt lịch ngay</span>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            calendar_add_on
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Database Pagination */}
              <Suspense fallback={null}>
                <ServicePaginationClient
                  currentPage={servicesResult.page}
                  totalPages={servicesResult.totalPages}
                  totalCount={servicesResult.totalCount}
                />
              </Suspense>
            </>
          )}
        </>
      )}
    </div>
  );
}
