'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { Booking, BookingStatus } from '@/types/booking';
import { Staff } from '@/types/staff';
import { bookingService } from '@/services/bookingService';
import { staffService } from '@/services/staffService';
import { formatCurrency, formatDate, formatTime, formatDateTime } from '@/utils/formatters';
import { canCancelBooking, canCompleteBooking, canConfirmBooking } from '@/utils/statusPredicates';
import { StatusBadge } from '@/components/common/Badge/StatusBadge';
import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { PaginationControls } from '@/components/common/Pagination/PaginationControls';
import { EmptyState, ErrorAlert, LoadingSkeleton } from '@/components/common/Feedback/StateFeedback';

const cancelSchema = z.object({
  reason: z.string().min(3, 'Vui lòng nhập lý do hủy (tối thiểu 3 ký tự).'),
});

export function AdminBookingsView() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);

  // Filter States
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<BookingStatus | ''>('');
  const [filterStaffId, setFilterStaffId] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Action / Cancel Modal
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Staffs for filter
  useEffect(() => {
    async function loadStaffs() {
      try {
        const list = await staffService.getAll();
        setStaffs(list);
      } catch {
        // Silent fail
      }
    }
    loadStaffs();
  }, []);

  // Fetch Bookings
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await bookingService.getAllBookings({
        date: filterDate || undefined,
        status: (filterStatus as BookingStatus) || undefined,
        staffId: filterStaffId || undefined,
        search: filterSearch.trim() || undefined,
        page: currentPage,
        pageSize,
      });

      setBookings(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMessage(err.message);
      else setErrorMessage('Không thể tải danh sách booking.');
    } finally {
      setIsLoading(false);
    }
  }, [filterDate, filterStatus, filterStaffId, filterSearch, currentPage, pageSize]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle Update Status (Confirm / Complete)
  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    setIsProcessing(true);
    try {
      await bookingService.updateStatus(id, { status });
      fetchBookings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Thao tác không thành công.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Admin Cancel
  const handleExecuteCancel = async () => {
    if (!cancellingBooking) return;

    const validation = cancelSchema.safeParse({ reason: cancelReason.trim() });
    if (!validation.success) {
      setCancelError(validation.error.issues[0].message);
      return;
    }

    setIsProcessing(true);
    setCancelError(null);

    try {
      await bookingService.cancel(cancellingBooking.id, {
        cancellationReason: cancelReason.trim(),
      });
      setCancellingBooking(null);
      setCancelReason('');
      fetchBookings();
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : 'Không thể hủy lịch này.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetFilters = () => {
    setFilterDate('');
    setFilterStatus('');
    setFilterStaffId('');
    setFilterSearch('');
    setCurrentPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '18px',
        }}
      >
        <div>
          <span
            style={{
              backgroundColor: 'var(--color-info-bg)',
              color: 'var(--color-info)',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.88rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Khu vực Quản trị viên
          </span>
          <h1 style={{ color: 'var(--color-primary)', marginTop: '6px' }}>
            Quản Trị Toàn Bộ Lịch Hẹn (Bookings Console)
          </h1>
          <p style={{ fontSize: '1.02rem', color: 'var(--color-text-muted)' }}>
            Theo dõi, lọc theo ngày, thợ, trạng thái và duyệt hoặc hoàn thành lịch hẹn của khách.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={handleResetFilters}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            restart_alt
          </span>
          <span>Xóa bộ lọc</span>
        </Button>
      </div>

      {/* Multi-filter Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: '18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          alignItems: 'end',
        }}
      >
        {/* Search */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '0.88rem' }}>
            <span className="material-symbols-outlined">search</span>
            <span>Tìm khách / Mã đơn:</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Tên, Email hoặc Mã..."
            value={filterSearch}
            onChange={(e) => {
              setFilterSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Date Filter */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '0.88rem' }}>
            <span className="material-symbols-outlined">calendar_today</span>
            <span>Lọc theo ngày:</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Status Filter */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '0.88rem' }}>
            <span className="material-symbols-outlined">tune</span>
            <span>Trạng thái:</span>
          </label>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as BookingStatus | '');
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">Chờ duyệt (Pending)</option>
            <option value="Confirmed">Đã duyệt (Confirmed)</option>
            <option value="Completed">Đã hoàn thành (Completed)</option>
            <option value="Cancelled">Đã hủy (Cancelled)</option>
          </select>
        </div>

        {/* Staff Filter */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '0.88rem' }}>
            <span className="material-symbols-outlined">person</span>
            <span>Chuyên viên phục vụ:</span>
          </label>
          <select
            className="form-select"
            value={filterStaffId}
            onChange={(e) => {
              setFilterStaffId(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả chuyên viên</option>
            {staffs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage && <ErrorAlert message={errorMessage} onRetry={fetchBookings} />}

      {/* Bookings Table */}
      {isLoading ? (
        <LoadingSkeleton count={5} type="table-row" />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="assignment"
          title="Không tìm thấy lịch hẹn nào"
          description="Không có lịch hẹn nào khớp với bộ lọc hiện tại. Thử bấm 'Xóa bộ lọc' ở trên."
          action={
            <Button variant="outline" onClick={handleResetFilters}>
              Xóa bộ lọc
            </Button>
          }
        />
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="aura-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '150px' }}>MÃ ĐƠN</th>
                  <th style={{ minWidth: '190px' }}>KHÁCH HÀNG</th>
                  <th style={{ minWidth: '200px' }}>DỊCH VỤ & GIÁ</th>
                  <th style={{ minWidth: '160px' }}>CHUYÊN VIÊN</th>
                  <th style={{ minWidth: '170px' }}>THỜI GIAN HẸN</th>
                  <th style={{ minWidth: '150px' }}>TRẠNG THÁI</th>
                  <th style={{ minWidth: '170px', textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((item) => {
                  const canConfirm = canConfirmBooking(item);
                  const canComplete = canCompleteBooking(item);
                  const canCancel = canCancelBooking(item);

                  return (
                    <tr key={item.id}>
                      {/* Mã Đơn */}
                      <td>
                        <span className="booking-code-badge">{item.bookingCode}</span>
                        {item.customerNote && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '4px',
                              marginTop: '6px',
                              fontSize: '0.8rem',
                              color: 'var(--color-text-subtle)',
                              maxWidth: '180px',
                              lineHeight: 1.35,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', flexShrink: 0, marginTop: '2px', color: 'var(--color-secondary)' }}>
                              notes
                            </span>
                            <span style={{ wordBreak: 'break-word' }}>{item.customerNote}</span>
                          </div>
                        )}
                      </td>

                      {/* Khách Hàng */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                          {item.customerName || 'Khách vãng lai'}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.82rem',
                            color: 'var(--color-text-subtle)',
                            marginTop: '3px',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                            mail
                          </span>
                          <span style={{ whiteSpace: 'nowrap' }}>{item.customerEmail}</span>
                        </div>
                      </td>

                      {/* Dịch Vụ & Giá */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {item.serviceName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span className="service-price-pill">{formatCurrency(item.servicePrice)}</span>
                          <span
                            className="service-duration-hint"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                              schedule
                            </span>
                            <span>{item.durationMinutes} phút</span>
                          </span>
                        </div>
                      </td>

                      {/* Chuyên Viên */}
                      <td>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            backgroundColor: 'var(--color-bg)',
                            borderRadius: '20px',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-secondary)' }}>
                            person
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                            {item.staffName}
                          </span>
                        </div>
                      </td>

                      {/* Thời Gian Hẹn */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              color: 'var(--color-text)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-primary)' }}>
                              calendar_today
                            </span>
                            <span>{formatDate(item.startTime)}</span>
                          </div>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.82rem',
                              color: 'var(--color-text-subtle)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                              schedule
                            </span>
                            <span>
                              {formatTime(item.startTime)} - {formatTime(item.endTime)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Trạng Thái */}
                      <td>
                        <StatusBadge status={item.status} />
                        {item.cancellationReason && (
                          <div className="cancel-callout">
                            <strong>Lý do:</strong> {item.cancellationReason}
                          </div>
                        )}
                      </td>

                      {/* Thao Tác */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          {/* Duyệt đơn */}
                          {canConfirm && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(item.id, 'Confirmed')}
                              className="btn btn-primary"
                              style={{
                                minHeight: '34px',
                                padding: '4px 10px',
                                fontSize: '0.84rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                              }}
                              title="Duyệt lịch hẹn này"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                check
                              </span>
                              <span>Duyệt</span>
                            </button>
                          )}

                          {/* Hoàn thành */}
                          {canComplete && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(item.id, 'Completed')}
                              className="btn btn-secondary"
                              style={{
                                minHeight: '34px',
                                padding: '4px 10px',
                                fontSize: '0.84rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                              }}
                              title="Xác nhận hoàn thành phục vụ"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                done_all
                              </span>
                              <span>Xong</span>
                            </button>
                          )}

                          {/* Hủy */}
                          {canCancel && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => {
                                setCancellingBooking(item);
                                setCancelReason('');
                                setCancelError(null);
                              }}
                              className="btn btn-outline"
                              style={{
                                minHeight: '34px',
                                padding: '4px 10px',
                                fontSize: '0.84rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                color: 'var(--color-danger, #c0392b)',
                                borderColor: 'rgba(192, 57, 43, 0.3)',
                              }}
                              title="Hủy lịch hẹn này"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                close
                              </span>
                              <span>Hủy</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Modal Hủy Lịch */}
      <Modal
        isOpen={Boolean(cancellingBooking)}
        onClose={() => {
          if (!isProcessing) setCancellingBooking(null);
        }}
        title={`Quản trị viên hủy đơn [${cancellingBooking?.bookingCode}]`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setCancellingBooking(null)}
              disabled={isProcessing}
            >
              Quay lại
            </Button>
            <Button
              variant="danger"
              onClick={handleExecuteCancel}
              isLoading={isProcessing}
              loadingText="Đang hủy..."
              disabled={!cancelReason.trim()}
            >
              Xác nhận Hủy Đơn
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.98rem', color: 'var(--color-text-main)' }}>
            Vui lòng nhập lý do hủy đơn của khách hàng. Khung giờ của thợ sẽ được giải phóng ngay sau khi hủy.
          </p>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              Lý do hủy đơn <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="ví dụ: Khách gọi điện xin hủy, thợ bận đột xuất..."
              rows={3}
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (cancelError) setCancelError(null);
              }}
              disabled={isProcessing}
            />
            {cancelError && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.88rem' }}>{cancelError}</span>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
