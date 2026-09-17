'use client';

import React from 'react';
import { AvailableSlot } from '@/types/booking';
import { formatDate, formatTime } from '@/utils/formatters';

interface SlotStepProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  slots: AvailableSlot[];
  selectedSlot: AvailableSlot | null;
  onSelectSlot: (slot: AvailableSlot) => void;
  isLoadingSlots: boolean;
  minDate: string;
  maxDate?: string;
}

export function SlotStep({
  selectedDate,
  onDateChange,
  slots,
  selectedSlot,
  onSelectSlot,
  isLoadingSlots,
  minDate,
  maxDate,
}: SlotStepProps) {
  // Generate next 7 days for quick carousel selection
  const daysList: { dateStr: string; dayLabel: string; dateNum: number; isToday: boolean }[] = [];
  const baseDate = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    daysList.push({
      dateStr,
      dayLabel: dayNames[d.getDay()],
      dateNum: d.getDate(),
      isToday: i === 0,
    });
  }

  // Partition slots into Morning (before 12:00) and Afternoon/Evening (12:00 onwards)
  const morningSlots = slots.filter((s) => {
    const hour = new Date(s.startTime).getHours();
    return hour < 12;
  });
  const afternoonSlots = slots.filter((s) => {
    const hour = new Date(s.startTime).getHours();
    return hour >= 12;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Step Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="step-badge">3</span>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>
              Chọn Ngày & Khung Giờ Hẹn
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-subtle)' }}>
              Hệ thống cập nhật tình trạng khung giờ trống theo thời gian thực (Real-time)
            </p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)' }} />
            Đang chọn
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
            Còn trống
          </span>
        </div>
      </div>

      {/* 7-Day Quick Date Picker Carousel */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label htmlFor="bookingDate" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
            Lịch 7 ngày tới (Bấm chọn nhanh):
          </label>
          <input
            id="bookingDate"
            type="date"
            min={minDate}
            max={maxDate}
            value={selectedDate}
            onChange={(e) => {
              const val = e.target.value;
              if (maxDate && val > maxDate) {
                onDateChange(maxDate);
                return;
              }
              if (minDate && val < minDate) {
                onDateChange(minDate);
                return;
              }
              onDateChange(val);
            }}
            style={{
              width: 'auto',
              padding: '6px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-secondary)' }}>
            info
          </span>
          <span>
            Hệ thống mở lịch đặt trước tối đa trong 7 ngày tới{maxDate ? ` (từ hôm nay đến ${formatDate(maxDate)})` : ''}.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {daysList.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => onDateChange(d.dateStr)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px 4px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-lowest)',
                  color: isSelected ? '#ffffff' : 'var(--color-text-main)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: isSelected ? 0.85 : 0.65 }}>
                  {d.dayLabel}
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0' }}>
                  {d.dateNum}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: isSelected ? '#6ffbbe' : 'var(--color-secondary)',
                  }}
                >
                  {d.isToday ? 'Hôm nay' : 'Mở lịch'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Slots Section */}
      <div>
        {isLoadingSlots ? (
          <div
            className="aura-card"
            style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}
          >
            <span className="spinner" style={{ borderColor: 'var(--color-secondary)', borderTopColor: 'transparent', width: '24px', height: '24px', marginBottom: '12px' }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Đang tra cứu khung giờ trống của chuyên viên...</div>
          </div>
        ) : slots.length === 0 ? (
          <div
            className="aura-card"
            style={{
              padding: '32px 24px',
              textAlign: 'center',
              backgroundColor: '#fffbeb',
              borderColor: '#fde68a',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#b45309', marginBottom: '8px' }}>
              event_busy
            </span>
            <h3 style={{ fontSize: '1.08rem', color: '#92400e', marginBottom: '4px' }}>
              Không còn khung giờ trống trong ngày đã chọn
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#b45309', maxWidth: '440px', margin: '0 auto' }}>
              Chuyên viên đã kín lịch hẹn hoặc không có ca làm việc vào ngày này. Quý khách vui lòng chọn một ngày khác trên thanh lịch phía trên.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Morning Wave */}
            {morningSlots.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--color-text-muted)',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    light_mode
                  </span>
                  Khung Giờ Buổi Sáng (08:00 – 12:00)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {morningSlots.map((slot, index) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => onSelectSlot(slot)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px 8px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--color-secondary)' : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-secondary)' : 'var(--color-surface-lowest)',
                          color: isSelected ? '#ffffff' : 'var(--color-text-main)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(0, 108, 73, 0.25)' : 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                            {formatTime(slot.startTime)}
                          </span>
                          {isSelected && (
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                              check
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', opacity: isSelected ? 0.9 : 0.65 }}>
                          đến {formatTime(slot.endTime)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Afternoon Wave */}
            {afternoonSlots.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--color-text-muted)',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    wb_twilight
                  </span>
                  Khung Giờ Buổi Chiều & Tối (12:00 – 21:00)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {afternoonSlots.map((slot, index) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => onSelectSlot(slot)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px 8px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--color-secondary)' : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-secondary)' : 'var(--color-surface-lowest)',
                          color: isSelected ? '#ffffff' : 'var(--color-text-main)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(0, 108, 73, 0.25)' : 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                            {formatTime(slot.startTime)}
                          </span>
                          {isSelected && (
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                              check
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', opacity: isSelected ? 0.9 : 0.65 }}>
                          đến {formatTime(slot.endTime)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
