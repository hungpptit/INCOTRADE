'use client';

import React from 'react';
import Image from 'next/image';
import { Service } from '@/types/service';
import { Staff } from '@/types/staff';
import { AvailableSlot } from '@/types/booking';
import { formatCurrency, formatDate, formatDuration, formatTime } from '@/utils/formatters';
import { Button } from '@/components/common/Button/Button';

interface OrderSummaryCardProps {
  selectedService: Service | null;
  selectedStaff: Staff | null;
  selectedDate: string;
  selectedSlot: AvailableSlot | null;
  customerNote: string;
  onCustomerNoteChange: (note: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onBack?: () => void;
}

export function OrderSummaryCard({
  selectedService,
  selectedStaff,
  selectedDate,
  selectedSlot,
  customerNote,
  onCustomerNoteChange,
  onSubmit,
  isSubmitting,
  onBack,
}: OrderSummaryCardProps) {
  const isReady = Boolean(selectedService && selectedStaff && selectedSlot);

  return (
    <div
      className="aura-card"
      style={{
        position: 'sticky',
        top: '90px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Summary Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>
            Tóm Tắt Buổi Hẹn
          </h2>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--color-secondary)',
            backgroundColor: 'var(--color-accent-subtle)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {isReady ? 'Sẵn sàng đặt' : 'Đang chọn'}
        </span>
      </div>

      {/* Selected Service Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>
            Dịch vụ đã chọn
          </span>
          <h4 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
            {selectedService ? selectedService.name : 'Chưa chọn dịch vụ'}
          </h4>
          {selectedService && (
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', display: 'block', marginTop: '2px' }}>
              Thời lượng gói: {formatDuration(selectedService.durationMinutes)}
            </span>
          )}
        </div>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
          {selectedService ? formatCurrency(selectedService.price) : '0 ₫'}
        </span>
      </div>

      {/* Selected Specialist Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-surface-low)',
        }}
      >
        <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
          <Image
            src="/images/barber-avatar.png"
            alt={selectedStaff ? selectedStaff.fullName : 'Chuyên viên'}
            fill
            sizes="38px"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block' }}>
            {selectedStaff ? selectedStaff.fullName : 'Chưa chọn chuyên viên'}
          </span>
          <span style={{ fontSize: '0.76rem', color: 'var(--color-text-subtle)' }}>
            {selectedStaff ? 'Chuyên viên chính phụ trách' : 'Sẽ chọn ở Bước 2'}
          </span>
        </div>
      </div>

      {/* Timeline Details Box */}
      <div
        style={{
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-surface-low)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-subtle)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              calendar_today
            </span>
            Ngày hẹn:
          </span>
          <strong style={{ color: 'var(--color-primary)' }}>
            {selectedDate ? formatDate(selectedDate) : '—'}
          </strong>
        </div>

        {/* Start Time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-subtle)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              schedule
            </span>
            Giờ bắt đầu:
          </span>
          <strong style={{ color: selectedSlot ? 'var(--color-primary)' : 'var(--color-text-subtle)' }}>
            {selectedSlot ? formatTime(selectedSlot.startTime) : '— Chưa chọn —'}
          </strong>
        </div>

        {/* Calculated End Time (Stitch design preview) */}
        {selectedSlot && selectedService && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-surface-lowest)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid rgba(0, 108, 73, 0.15)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                update
              </span>
              Dự kiến kết thúc:
            </span>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
              {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)} ({selectedService.durationMinutes}p)
            </span>
          </div>
        )}
      </div>

      {/* Customer Note */}
      <div>
        <label htmlFor="customerNote" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px' }}>
          Ghi chú cho chuyên viên (không bắt buộc):
        </label>
        <textarea
          id="customerNote"
          rows={2}
          maxLength={250}
          placeholder="ví dụ: Da đầu nhạy cảm, chỉ dùng kéo, cạo râu nhẹ..."
          value={customerNote}
          onChange={(e) => onCustomerNoteChange(e.target.value)}
          disabled={isSubmitting}
          style={{ fontSize: '0.88rem', resize: 'none' }}
        />
      </div>

      {/* Total Due */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '6px',
          borderTop: '1px solid var(--color-border-subtle)',
        }}
      >
        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
          Tổng thanh toán:
        </span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
          {selectedService ? formatCurrency(selectedService.price) : '0 ₫'}
        </span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        <Button
          variant="primary"
          size="lg"
          disabled={!isReady || isSubmitting}
          isLoading={isSubmitting}
          loadingText="Đang xác nhận lịch hẹn..."
          onClick={onSubmit}
          style={{
            width: '100%',
            minHeight: '52px',
            fontSize: '1.05rem',
            backgroundColor: isReady ? 'var(--color-primary)' : undefined,
          }}
        >
          {isReady ? (
            <>
              <span>Xác Nhận Đặt Lịch • {selectedService ? formatCurrency(selectedService.price) : ''}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                check
              </span>
            </>
          ) : !selectedService ? (
            'Vui lòng chọn dịch vụ (Bước 1)'
          ) : !selectedStaff ? (
            'Vui lòng chọn chuyên viên (Bước 2)'
          ) : (
            'Vui lòng chọn khung giờ (Bước 3)'
          )}
        </Button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="btn btn-outline"
            style={{
              width: '100%',
              minHeight: '44px',
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              arrow_back
            </span>
            <span>Quay lại đổi ngày giờ hoặc chuyên viên</span>
          </button>
        )}
      </div>

      {/* Assurance Note */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)', marginRight: '6px' }} />
          Bảo đảm không trùng lịch • Quý khách được hủy lịch trước giờ hẹn ít nhất 2 tiếng.
        </p>
      </div>
    </div>
  );
}
