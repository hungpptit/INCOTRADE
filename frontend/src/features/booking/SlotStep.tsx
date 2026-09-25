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

  // Check if selectedDate is today in local time
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const isSelectedToday = selectedDate === todayStr;

  // Helper to extract the actual hour and minute of slot
  const getSlotHourMinute = (isoString: string): { hour: number; minute: number } => {
    const formatted = formatTime(isoString);
    const [h, m] = formatted.split(':').map((v) => parseInt(v, 10));
    return {
      hour: isNaN(h) ? 12 : h,
      minute: isNaN(m) ? 0 : m,
    };
  };

  // Filter out slots that have already passed if selected date is today
  const activeSlots = slots.filter((slot) => {
    if (!isSelectedToday) return true;
    const { hour, minute } = getSlotHourMinute(slot.startTime);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    return hour > currentHour || (hour === currentHour && minute > currentMinute);
  });

  // Partition slots into Morning (before 12:00) and Afternoon/Evening (12:00 onwards)
  const morningSlots = activeSlots.filter((s) => getSlotHourMinute(s.startTime).hour < 12);
  const afternoonSlots = activeSlots.filter((s) => getSlotHourMinute(s.startTime).hour >= 12);

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
              Hệ thống cập nhật tình trạng khung giờ trống theo thời gian thực
            </p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)' }} />
            Đang chọn
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffffff', border: '1px solid var(--color-border)' }} />
            Còn trống
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1' }} />
            Đã kín
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
        ) : activeSlots.length === 0 ? (
          <div
            className="aura-card"
            style={{
              padding: '36px 24px',
              textAlign: 'center',
              backgroundColor: '#fffbeb',
              borderColor: '#fde68a',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '38px', color: '#b45309', marginBottom: '8px' }}>
              {isSelectedToday ? 'schedule' : 'event_busy'}
            </span>
            <h3 style={{ fontSize: '1.08rem', color: '#92400e', marginBottom: '6px' }}>
              {isSelectedToday
                ? 'Đã hết khung giờ phục vụ trong ngày hôm nay'
                : 'Không còn khung giờ trống trong ngày đã chọn'}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#b45309', maxWidth: '460px', margin: '0 auto 16px', lineHeight: 1.5 }}>
              {isSelectedToday
                ? 'Toàn bộ ca làm việc trong ngày hôm nay đã kết thúc hoặc đã kín lịch hẹn. Quý khách vui lòng chọn các ngày tiếp theo trên lịch.'
                : 'Chuyên viên đã kín lịch hẹn hoặc không có ca làm việc vào ngày này. Quý khách vui lòng chọn một ngày khác trên thanh lịch phía trên.'}
            </p>
            {isSelectedToday && daysList.length > 1 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onDateChange(daysList[1].dateStr)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>Xem lịch ngày mai ({daysList[1].dayLabel} - {daysList[1].dateNum})</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </button>
            )}
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
                    const isBooked = slot.isAvailable === false;
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={isBooked}
                        onClick={() => !isBooked && onSelectSlot(slot)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px 8px',
                          borderRadius: 'var(--radius-md)',
                          border: isBooked
                            ? '1px dashed var(--color-border)'
                            : isSelected
                              ? '2px solid var(--color-secondary)'
                              : '1px solid var(--color-border)',
                          backgroundColor: isBooked
                            ? '#f8fafc'
                            : isSelected
                              ? 'var(--color-secondary)'
                              : 'var(--color-surface-lowest)',
                          color: isBooked
                            ? 'var(--color-outline-variant)'
                            : isSelected
                              ? '#ffffff'
                              : 'var(--color-text-main)',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          opacity: isBooked ? 0.75 : 1,
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(0, 108, 73, 0.25)' : 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span
                            style={{
                              fontSize: '1.05rem',
                              fontWeight: 800,
                            }}
                          >
                            {formatTime(slot.startTime)}
                          </span>
                          {isSelected && (
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                              check
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', opacity: isSelected ? 0.9 : 0.65 }}>
                          {isBooked ? 'Đã có khách' : `đến ${formatTime(slot.endTime)}`}
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
                    const isBooked = slot.isAvailable === false;
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={isBooked}
                        onClick={() => !isBooked && onSelectSlot(slot)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px 8px',
                          borderRadius: 'var(--radius-md)',
                          border: isBooked
                            ? '1px dashed var(--color-border)'
                            : isSelected
                              ? '2px solid var(--color-secondary)'
                              : '1px solid var(--color-border)',
                          backgroundColor: isBooked
                            ? '#f8fafc'
                            : isSelected
                              ? 'var(--color-secondary)'
                              : 'var(--color-surface-lowest)',
                          color: isBooked
                            ? 'var(--color-outline-variant)'
                            : isSelected
                              ? '#ffffff'
                              : 'var(--color-text-main)',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          opacity: isBooked ? 0.75 : 1,
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(0, 108, 73, 0.25)' : 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span
                            style={{
                              fontSize: '1.05rem',
                              fontWeight: 800,
                            }}
                          >
                            {formatTime(slot.startTime)}
                          </span>
                          {isSelected && (
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                              check
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', opacity: isSelected ? 0.9 : 0.65 }}>
                          {isBooked ? 'Đã có khách' : `đến ${formatTime(slot.endTime)}`}
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
