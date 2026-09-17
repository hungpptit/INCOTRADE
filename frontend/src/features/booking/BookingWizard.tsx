'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Service } from '@/types/service';
import { Staff } from '@/types/staff';
import { AvailableSlot, Booking } from '@/types/booking';
import { bookingService } from '@/services/bookingService';
import { ApiError } from '@/services/httpClient';
import { ServiceStep } from './ServiceStep';
import { StaffStep } from './StaffStep';
import { SlotStep } from './SlotStep';
import { OrderSummaryCard } from './OrderSummaryCard';
import { ConflictAlert, ErrorAlert } from '@/components/common/Feedback/StateFeedback';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { formatCurrency, formatDate, formatDateTime, formatTime } from '@/utils/formatters';

interface BookingWizardProps {
  services: Service[];
  staffs: Staff[];
  initialServiceId?: string;
}

export function BookingWizard({ services, staffs, initialServiceId }: BookingWizardProps) {
  // Selected states
  const [selectedService, setSelectedService] = useState<Service | null>(
    services.find((s) => s.id === initialServiceId) || services[0] || null
  );
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(staffs[0] || null);

  // Current Step: 1: Service, 2: Specialist, 3: Date & Time
  // Nếu vào từ ?serviceId=..., chuyển thẳng vào Bước 2 (Chuyên viên)
  const [currentStep, setCurrentStep] = useState<number>(initialServiceId ? 2 : 1);

  // Default date = today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 6);
  const maxDateStr = maxDateObj.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Slots
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Form & Submit
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Function to fetch slots
  const fetchSlots = useCallback(async () => {
    if (!selectedService || !selectedStaff || !selectedDate) {
      setSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    setConflictError(null);

    try {
      const available = await bookingService.getAvailableSlots({
        staffId: selectedStaff.id,
        serviceId: selectedService.id,
        date: selectedDate,
      });
      setSlots(available);
    } catch {
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedService, selectedStaff, selectedDate]);

  // Re-fetch slots when service, staff, or date changes
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Reset selected slot if staff or date changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedStaff, selectedDate]);

  // Check if step is accessible
  const canGoToStep = (step: number): boolean => {
    if (step === 1) return true;
    if (step === 2) return Boolean(selectedService);
    if (step === 3) return Boolean(selectedService && selectedStaff);
    return false;
  };

  const goToStep = (step: number) => {
    if (canGoToStep(step)) {
      setCurrentStep(step);
      setGeneralError(null);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Handle Booking Submit
  const handleSubmitBooking = async () => {
    if (!selectedService || !selectedStaff || !selectedSlot) {
      setGeneralError('Vui lòng chọn đầy đủ Dịch vụ, Thợ phục vụ và Khung giờ.');
      return;
    }

    setIsSubmitting(true);
    setConflictError(null);
    setGeneralError(null);

    try {
      const created = await bookingService.create({
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        startTime: selectedSlot.startTime,
        customerNote: customerNote.trim() || undefined,
      });

      setCreatedBooking(created);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setConflictError(
            err.message ||
              'Khung giờ này vừa có khách hàng khác đặt trước mất rồi. Quý khách vui lòng chọn khung giờ khác bên dưới!'
          );
          setSelectedSlot(null);
          setCurrentStep(3); // Tự động đưa về Bước 3 để chọn lại giờ
          fetchSlots();
          return;
        }
        setGeneralError(err.message);
      } else {
        setGeneralError('Không thể tạo lịch hẹn lúc này. Quý khách vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCreatedBooking(null);
    setSelectedSlot(null);
    setCustomerNote('');
    setCurrentStep(1);
    fetchSlots();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 3-Step Interactive Stepper Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 20px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: '#ffffff',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="pill-step-item"
            style={{
              cursor: 'pointer',
              border: 'none',
              fontFamily: 'inherit',
              backgroundColor:
                currentStep === 1
                  ? 'var(--color-primary)'
                  : selectedService
                  ? 'var(--color-accent-subtle)'
                  : 'var(--color-surface-low)',
              color:
                currentStep === 1
                  ? '#ffffff'
                  : selectedService
                  ? 'var(--color-secondary)'
                  : 'var(--color-text-subtle)',
              boxShadow: currentStep === 1 ? '0 2px 8px rgba(11,28,48,0.2)' : 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {selectedService && currentStep > 1 ? 'check_circle' : 'looks_one'}
            </span>
            <span>1. Dịch vụ</span>
          </button>

          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-outline-variant)' }}>
            chevron_right
          </span>

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => goToStep(2)}
            disabled={!canGoToStep(2)}
            className="pill-step-item"
            style={{
              cursor: canGoToStep(2) ? 'pointer' : 'not-allowed',
              border: 'none',
              fontFamily: 'inherit',
              opacity: canGoToStep(2) ? 1 : 0.6,
              backgroundColor:
                currentStep === 2
                  ? 'var(--color-primary)'
                  : selectedStaff && currentStep > 2
                  ? 'var(--color-accent-subtle)'
                  : 'var(--color-surface-low)',
              color:
                currentStep === 2
                  ? '#ffffff'
                  : selectedStaff && currentStep > 2
                  ? 'var(--color-secondary)'
                  : 'var(--color-text-subtle)',
              boxShadow: currentStep === 2 ? '0 2px 8px rgba(11,28,48,0.2)' : 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {selectedStaff && currentStep > 2 ? 'check_circle' : 'looks_two'}
            </span>
            <span>2. Chuyên viên</span>
          </button>

          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-outline-variant)' }}>
            chevron_right
          </span>

          {/* Step 3 Pill */}
          <button
            type="button"
            onClick={() => goToStep(3)}
            disabled={!canGoToStep(3)}
            className="pill-step-item"
            style={{
              cursor: canGoToStep(3) ? 'pointer' : 'not-allowed',
              border: 'none',
              fontFamily: 'inherit',
              opacity: canGoToStep(3) ? 1 : 0.6,
              backgroundColor:
                currentStep === 3
                  ? 'var(--color-primary)'
                  : selectedSlot
                  ? 'var(--color-accent-subtle)'
                  : 'var(--color-surface-low)',
              color:
                currentStep === 3
                  ? '#ffffff'
                  : selectedSlot
                  ? 'var(--color-secondary)'
                  : 'var(--color-text-subtle)',
              boxShadow: currentStep === 3 ? '0 2px 8px rgba(11,28,48,0.2)' : 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {selectedSlot ? 'check_circle' : 'looks_3'}
            </span>
            <span>3. Ngày &amp; Giờ</span>
          </button>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-secondary)' }}>verified</span>
          <span>Bảo đảm không trùng lịch</span>
        </div>
      </div>

      {/* 409 Conflict Alert Box */}
      {conflictError && (
        <ConflictAlert
          message={conflictError}
          onSelectAnother={() => {
            goToStep(3);
          }}
        />
      )}

      {/* General Error Alert */}
      {generalError && <ErrorAlert message={generalError} />}

      {/* Side-by-Side 2-Column Responsive Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '28px',
          alignItems: 'start',
        }}
        className="booking-two-columns"
      >
        {/* Left Column: Active Step Selection Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* STEP 1: Chọn Dịch Vụ */}
          {currentStep === 1 && (
            <div className="aura-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <ServiceStep
                services={services}
                selectedServiceId={selectedService?.id || null}
                initialCollapsed={false}
                onSelect={(service) => setSelectedService(service)}
              />

              {/* Step 1 Bottom Action Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--color-border-subtle)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedService ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-secondary)', flexShrink: 0 }}>
                        check_circle
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Đã chọn: <strong>{selectedService.name}</strong> •{' '}
                        <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>
                          {formatCurrency(selectedService.price)}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.88rem', color: 'var(--color-text-subtle)' }}>
                      Vui lòng bấm chọn một gói dịch vụ bên trên
                    </span>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="md"
                  disabled={!selectedService}
                  onClick={() => goToStep(2)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <span>Tiếp tục: Chọn Chuyên Viên</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    arrow_forward
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Chọn Chuyên Viên Phục Vụ */}
          {currentStep === 2 && (
            <div className="aura-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <StaffStep
                staffs={staffs}
                selectedStaffId={selectedStaff?.id || null}
                onSelect={(staff) => setSelectedStaff(staff)}
              />

              {/* Step 2 Bottom Action Bar (Căn ngang hàng) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--color-border-subtle)',
                }}
              >
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => goToStep(1)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    arrow_back
                  </span>
                  <span>Quay lại: Chọn Dịch Vụ</span>
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  disabled={!selectedStaff}
                  onClick={() => goToStep(3)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>Tiếp tục: Chọn Ngày &amp; Giờ</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    arrow_forward
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Chọn Ngày & Khung Giờ Hẹn */}
          {currentStep === 3 && (
            <div className="aura-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <SlotStep
                selectedDate={selectedDate}
                onDateChange={(date) => setSelectedDate(date)}
                slots={slots}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot) => {
                  setSelectedSlot(slot);
                  setConflictError(null);
                }}
                isLoadingSlots={isLoadingSlots}
                minDate={todayStr}
                maxDate={maxDateStr}
              />

              {/* Step 3 Bottom Action Bar (Căn ngang hàng) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--color-border-subtle)',
                }}
              >
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => goToStep(2)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    arrow_back
                  </span>
                  <span>Quay lại: Chọn Chuyên Viên</span>
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  disabled={!selectedSlot || isSubmitting}
                  isLoading={isSubmitting}
                  loadingText="Đang xác nhận..."
                  onClick={handleSubmitBooking}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>Xác Nhận Đặt Lịch Ngay</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    check
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Live Order Summary Panel (Bảng tóm tắt thông tin kế bên) */}
        <div>
          <OrderSummaryCard
            selectedService={selectedService}
            selectedStaff={selectedStaff}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            customerNote={customerNote}
            onCustomerNoteChange={(note) => setCustomerNote(note)}
            onSubmit={handleSubmitBooking}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      {/* Success Modal */}
      {createdBooking && (
        <Modal
          isOpen={true}
          onClose={handleReset}
          title="Đặt Lịch Thành Công"
          footer={
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <Link
                href="/my-bookings"
                className="btn btn-primary"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <span>Xem Lịch Của Tôi</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  arrow_forward
                </span>
              </Link>
              <Button variant="outline" onClick={handleReset}>
                Đặt tiếp lịch khác
              </Button>
            </div>
          }
        >
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                fontSize: '1.05rem',
                color: 'var(--color-text-subtle)',
                marginBottom: '8px',
              }}
            >
              Mã đặt lịch của Quý khách:
            </div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: 'var(--color-accent)',
                backgroundColor: 'var(--color-accent-light)',
                padding: '10px 20px',
                borderRadius: '12px',
                display: 'inline-block',
                letterSpacing: '0.05em',
                marginBottom: '20px',
              }}
            >
              {createdBooking.bookingCode}
            </div>

            <div
              style={{
                textAlign: 'left',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '16px',
                fontSize: '0.98rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div>
                Dịch vụ: <strong>{createdBooking.serviceName || selectedService?.name}</strong>
              </div>
              <div>
                Thợ phục vụ: <strong>{createdBooking.staffName || selectedStaff?.fullName}</strong>
              </div>
              <div>
                Thời gian: <strong>{formatDateTime(createdBooking.startTime)}</strong>
              </div>
              <div>
                Tổng chi phí: <strong>{formatCurrency(createdBooking.servicePrice || selectedService?.price)}</strong>
              </div>
            </div>

            <p style={{ marginTop: '16px', color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
              Hệ thống đã ghi nhận lịch hẹn của bạn ở trạng thái <strong>Chờ duyệt (Pending)</strong>.
            </p>
          </div>
        </Modal>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .booking-two-columns {
            grid-template-columns: 1fr 380px !important;
          }
        }
      `}</style>
    </div>
  );
}
