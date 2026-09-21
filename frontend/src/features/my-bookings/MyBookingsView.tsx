'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Booking, BookingStatus } from '@/types/booking';
import { bookingService } from '@/services/bookingService';
import { authService } from '@/services/authService';
import { User } from '@/types/auth';
import { canCancelBooking } from '@/utils/statusPredicates';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import { StatusBadge } from '@/components/common/Badge/StatusBadge';
import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { PaginationControls } from '@/components/common/Pagination/PaginationControls';
import { EmptyState, ErrorAlert, LoadingSkeleton } from '@/components/common/Feedback/StateFeedback';

// Zod schema for cancellation
const cancelSchema = z.object({
  reason: z.string().min(3, 'Vui lòng nhập lý do hủy (tối thiểu 3 ký tự).'),
});

export function MyBookingsView() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);

  // Filters & Pagination
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'Newest' | 'StartTimeAsc' | 'StartTimeDesc'>('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cancel Modal states
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch My Bookings
  const fetchMyBookings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await bookingService.getMyBookings({
        date: selectedDate || undefined,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        sortBy,
        page: currentPage,
        pageSize,
      });

      setBookings(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tải danh sách lịch hẹn của bạn.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedStatus, sortBy, currentPage, pageSize]);

  useEffect(() => {
    setIsClientReady(true);
    const u = authService.getCurrentUser();
    setCurrentUser(u);
    if (!u) {
      setIsLoading(false);
      return;
    }
    fetchMyBookings();
  }, [fetchMyBookings]);

  // Handle Cancel Submit
  const handleExecuteCancel = async () => {
    if (!cancellingBooking) return;

    // Validate lý do hủy bằng Zod
    const validation = cancelSchema.safeParse({ reason: cancelReason.trim() });
    if (!validation.success) {
      setCancelError(validation.error.issues[0].message);
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      await bookingService.cancel(cancellingBooking.id, {
        cancellationReason: cancelReason.trim(),
      });

      // Đóng modal và tải lại dữ liệu
      setCancellingBooking(null);
      setCancelReason('');
      fetchMyBookings();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCancelError(err.message);
      } else {
        setCancelError('Không thể hủy lịch hẹn này.');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  // Waiting for client mount to avoid SSR hydration mismatch
  if (!isClientReady) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 0' }}>
        <LoadingSkeleton count={3} type="table-row" />
      </div>
    );
  }

  // Not logged in State
  if (!currentUser) {
    return (
      <EmptyState
        icon="lock"
        title="Vui lòng đăng nhập để xem lịch hẹn"
        description="Quý khách cần đăng nhập tài khoản Khách hàng để theo dõi danh sách lịch hẹn cá nhân."
        action={
          <Link href="/login?callbackUrl=/my-bookings" className="btn btn-primary btn-lg">
            Đăng nhập ngay →
          </Link>
        }
      />
    );
  }

  const statusFilters: Array<{ label: string; value: BookingStatus | 'ALL' }> = [
    { label: 'Tất cả lịch', value: 'ALL' },
    { label: 'Chờ duyệt', value: 'Pending' },
    { label: 'Đã xác nhận', value: 'Confirmed' },
    { label: 'Đã hoàn thành', value: 'Completed' },
    { label: 'Đã hủy', value: 'Cancelled' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '18px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                backgroundColor: 'var(--color-accent-light)',
                color: 'var(--color-accent)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.88rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Lịch Hẹn Cá Nhân
            </span>
          </div>
          <h1 style={{ color: 'var(--color-primary)', marginTop: '6px' }}>
            Danh Sách Lịch Đã Đặt Của Quý Khách
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>
            Theo dõi tình trạng đơn hẹn, thời gian phục vụ và thao tác hủy đơn khi có việc đột xuất.
          </p>
        </div>

        <Link href="/booking" className="btn btn-primary" style={{ minHeight: '48px', padding: '10px 22px' }}>
          + Đặt thêm lịch mới
        </Link>
      </div>

      {/* Filter Bar: Status Tabs + Date Filter */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          {/* Status Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '2px',
              maxWidth: '100%',
            }}
          >
            {statusFilters.map((tab) => {
              const isSelected = selectedStatus === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setSelectedStatus(tab.value);
                    setCurrentPage(1);
                  }}
                  className={`btn ${isSelected ? 'btn-secondary' : 'btn-outline'}`}
                  style={{
                    minHeight: '40px',
                    padding: '6px 16px',
                    fontSize: '0.94rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown + Date Picker Filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {/* Sort Select */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}
                title="Sắp xếp danh sách"
              >
                sort
              </span>
              <select
                className="form-select"
                style={{
                  minWidth: '185px',
                  padding: '8px 36px 8px 12px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-bg)',
                }}
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'Newest' | 'StartTimeAsc' | 'StartTimeDesc');
                  setCurrentPage(1);
                }}
                aria-label="Sắp xếp danh sách lịch hẹn"
              >
                <option value="Newest">Mới đặt nhất</option>
                <option value="StartTimeAsc">Ngày hẹn sớm nhất</option>
                <option value="StartTimeDesc">Ngày hẹn muộn nhất</option>
              </select>
            </div>

            {/* Date Picker Filter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--color-bg)',
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>
                calendar_month
              </span>
              <label
                htmlFor="customer-filter-date"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  whiteSpace: 'nowrap',
                }}
              >
                Lọc ngày:
              </label>
              <input
                id="customer-filter-date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  fontSize: '0.92rem',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              />
            </div>

            {selectedDate && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('');
                  setCurrentPage(1);
                }}
                className="btn btn-outline"
                style={{
                  minHeight: '38px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  color: 'var(--color-danger, #c0392b)',
                  borderColor: 'rgba(192, 57, 43, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Bỏ lọc ngày này"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  close
                </span>
                <span>Bỏ lọc ngày</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Notification */}
        {(selectedDate || selectedStatus !== 'ALL') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              paddingTop: '10px',
              borderTop: '1px dashed var(--color-border)',
              fontSize: '0.88rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                filter_alt
              </span>
              <span>
                Đang lọc:{' '}
                {selectedDate && (
                  <strong style={{ color: 'var(--color-primary)' }}>Ngày {formatDate(selectedDate)}</strong>
                )}
                {selectedDate && selectedStatus !== 'ALL' && ' & '}
                {selectedStatus !== 'ALL' && (
                  <strong style={{ color: 'var(--color-secondary)' }}>
                    Trạng thái &quot;{statusFilters.find((f) => f.value === selectedStatus)?.label}&quot;
                  </strong>
                )}
                {' '}— Tìm thấy <strong style={{ color: 'var(--color-primary)' }}>{totalCount}</strong> lịch hẹn
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedStatus('ALL');
                setSelectedDate('');
                setSortBy('Newest');
                setCurrentPage(1);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && <ErrorAlert message={errorMessage} onRetry={fetchMyBookings} />}

      {/* Bookings List */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="confirmation_number"
          title="Không tìm thấy lịch hẹn nào"
          description={
            selectedDate || selectedStatus !== 'ALL'
              ? `Không có lịch hẹn nào phù hợp với điều kiện lọc hiện tại. Quý khách có thể đổi ngày hoặc chuyển sang "Tất cả lịch".`
              : 'Quý khách chưa có lịch hẹn nào. Hãy bấm vào nút bên dưới để chọn dịch vụ và đặt lịch ngay nhé!'
          }
          action={
            <Link href="/booking" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>Đặt lịch ngay bây giờ</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bookings.map((booking) => {
            const cancellable = canCancelBooking(booking);

            return (
              <div
                key={booking.id}
                className="aura-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  padding: '22px 24px',
                  borderLeft: '5px solid var(--color-secondary)',
                }}
              >
                {/* Top Row: Code & Status */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.88rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                      MÃ ĐƠN:
                    </span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)', letterSpacing: '0.02em' }}>
                      {booking.bookingCode}
                    </strong>
                  </div>

                  <StatusBadge status={booking.status} />
                </div>

                {/* Middle Row: Appointment Details */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                      DỊCH VỤ CHĂM SÓC
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
                      {booking.serviceName || 'Dịch vụ chuẩn'}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-secondary)', marginTop: '2px' }}>
                      {formatCurrency(booking.servicePrice)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                      CHUYÊN VIÊN PHỤC VỤ
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-secondary)' }}>person</span>
                      <span>{booking.staffName || 'Chuyên viên Aura'}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                      THỜI GIAN HẸN
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-secondary)' }}>schedule</span>
                      <span>{formatDateTime(booking.startTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Note if exists */}
                {booking.customerNote && (
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.94rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <strong>Ghi chú của Quý khách:</strong> {booking.customerNote}
                  </div>
                )}

                {/* Cancellation Reason if cancelled */}
                {booking.cancellationReason && (
                  <div
                    style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fca5a5',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.94rem',
                      color: '#991b1b',
                    }}
                  >
                    <strong>Lý do đã hủy:</strong> {booking.cancellationReason}
                  </div>
                )}

                {/* Bottom Row: Actions (Only show cancel button if cancellable) */}
                {cancellable && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '12px',
                    }}
                  >
                    <Button
                      variant="danger-outline"
                      size="md"
                      onClick={() => {
                        setCancellingBooking(booking);
                        setCancelReason('');
                        setCancelError(null);
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cancel</span>
                      <span>Hủy lịch hẹn này</span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Modal Xác nhận Hủy Lịch Hẹn */}
      <Modal
        isOpen={Boolean(cancellingBooking)}
        onClose={() => {
          if (!isCancelling) setCancellingBooking(null);
        }}
        title={`Xác nhận Hủy Lịch Hẹn [${cancellingBooking?.bookingCode}]`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setCancellingBooking(null)}
              disabled={isCancelling}
            >
              Giữ lại lịch
            </Button>
            <Button
              variant="danger"
              onClick={handleExecuteCancel}
              isLoading={isCancelling}
              loadingText="Đang hủy..."
              disabled={!cancelReason.trim()}
            >
              Xác nhận Hủy Lịch
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
            Sau khi hủy, khung giờ đã chọn sẽ không còn được giữ lại. Bạn có thể đặt lịch mới khi cần.
          </p>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="cancelReasonInput">
              Lý do hủy lịch hẹn <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <textarea
              id="cancelReasonInput"
              className="form-textarea"
              placeholder="ví dụ: Tôi bận việc đột xuất, đổi lịch sau..."
              rows={3}
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (cancelError) setCancelError(null);
              }}
              disabled={isCancelling}
            />
            {cancelError && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.9rem', marginTop: '4px' }}>
                {cancelError}
              </span>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
