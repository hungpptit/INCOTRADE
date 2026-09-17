import React from 'react';
import { Service } from '@/types/service';
import { Staff } from '@/types/staff';
import { serviceService } from '@/services/serviceService';
import { staffService } from '@/services/staffService';
import { BookingWizard } from '@/features/booking/BookingWizard';
import { ErrorAlert } from '@/components/common/Feedback/StateFeedback';

export const dynamic = 'force-dynamic';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const initialServiceId = params.serviceId;

  let services: Service[] = [];
  let staffs: Staff[] = [];
  let errorMessage: string | null = null;

  try {
    const [servicesRes, staffsRes] = await Promise.all([
      serviceService.getAll({ isActive: true, pageSize: 100 }),
      staffService.getAll({ isActive: true }),
    ]);
    services = servicesRes.items;
    staffs = staffsRes;
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage = err.message;
    } else {
      errorMessage = 'Không thể tải dữ liệu dịch vụ hoặc chuyên viên phục vụ.';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
          <strong style={{ color: 'var(--color-text-main)' }}>Đặt lịch Dịch vụ Trực tuyến</strong>
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
            Studio Đang Mở Cửa • {staffs.length} Chuyên viên Sẵn Sàng
          </strong>
        </div>
      </div>

      {/* Main Page Title */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-secondary)',
            display: 'inline-block',
          }}
        >
          Real-Time Availability
        </span>
        <h1 style={{ color: 'var(--color-primary)' }}>Đặt Lịch Hẹn Chăm Sóc &amp; Thư Giãn</h1>
        <p style={{ maxWidth: '680px', fontSize: '0.98rem', color: 'var(--color-text-subtle)' }}>
          Hệ thống đặt hẹn trực tuyến với chuyên viên cá nhân và khung giờ được cập nhật theo thời gian thực.
        </p>
      </div>

      {/* Booking Form Content or Error */}
      {errorMessage ? (
        <ErrorAlert message={errorMessage} />
      ) : (
        <BookingWizard
          services={services}
          staffs={staffs}
          initialServiceId={initialServiceId}
        />
      )}
    </div>
  );
}
