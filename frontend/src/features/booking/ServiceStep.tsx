'use client';

import React, { useState } from 'react';
import { Service } from '@/types/service';
import { formatCurrency, formatDuration } from '@/utils/formatters';

interface ServiceStepProps {
  services: Service[];
  selectedServiceId: string | null;
  onSelect: (service: Service) => void;
  initialCollapsed?: boolean;
}

export function ServiceStep({
  services,
  selectedServiceId,
  onSelect,
  initialCollapsed = false,
}: ServiceStepProps) {
  const selectedService = services.find((s) => s.id === selectedServiceId) || null;
  // Chỉ thu gọn nếu caller yêu cầu initialCollapsed
  const [isCollapsed, setIsCollapsed] = useState<boolean>(initialCollapsed);

  const handleSelectService = (service: Service) => {
    onSelect(service);
    if (initialCollapsed) {
      setIsCollapsed(true);
    }
  };

  // Trạng thái THU GỌN: Khi đã chọn dịch vụ (từ /services hoặc vừa bấm chọn)
  if (isCollapsed && selectedService) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-secondary)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              1
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              Dịch Vụ Đã Chọn
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="btn btn-outline"
            style={{
              padding: '5px 12px',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              borderColor: 'var(--color-border)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              swap_horiz
            </span>
            <span>Đổi gói dịch vụ khác</span>
          </button>
        </div>

        {/* Selected Service Card Highlight */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#f4faf7',
            border: '2px solid var(--color-secondary)',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '28px', color: 'var(--color-secondary)', flexShrink: 0 }}
            >
              check_circle
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {selectedService.name}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-secondary)',
                    backgroundColor: 'rgba(0, 108, 73, 0.1)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  Đã khóa chọn
                </span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-text-subtle)', marginTop: '2px' }}>
                {selectedService.description || 'Dịch vụ chăm sóc và tạo hình chuyên sâu tiêu chuẩn Aura.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-text-subtle)',
                backgroundColor: 'var(--color-surface-lowest)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                schedule
              </span>
              <span>{formatDuration(selectedService.durationMinutes)}</span>
            </span>

            <span
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--color-secondary)',
              }}
            >
              {formatCurrency(selectedService.price)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái MỞ RỘNG: Hiển thị lưới dịch vụ để lựa chọn
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header of Step 1 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="step-badge">1</span>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>
              Chọn Dịch Vụ Phục Vụ
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-subtle)' }}>
              Bấm vào một gói dịch vụ bên dưới để tiếp tục sang chọn thợ
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedService && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="btn btn-outline"
              style={{ padding: '4px 12px', fontSize: '0.82rem' }}
            >
              Giữ nguyên gói hiện tại
            </button>
          )}
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-surface-low)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 500,
            }}
          >
            {services.length} gói dịch vụ có sẵn
          </span>
        </div>
      </div>

      {/* Grid of Service Cards */}
      <div className="grid-2">
        {services.map((s, idx) => {
          const isSelected = selectedServiceId === s.id;
          const isTopRated = idx === 0;

          return (
            <div
              key={s.id}
              onClick={() => handleSelectService(s)}
              className={`aura-card aura-card-interactive ${isSelected ? 'aura-card-selected' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px',
                minHeight: '170px',
                position: 'relative',
              }}
            >
              {/* Card Header: Category Tag & Price */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: isTopRated ? 'var(--color-secondary)' : '#94a3b8',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: isTopRated ? 'var(--color-secondary)' : 'var(--color-text-subtle)',
                      }}
                    >
                      {isTopRated ? 'Được ưa chuộng nhất' : 'Dịch vụ tiêu chuẩn'}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: isSelected ? 'var(--color-secondary)' : 'var(--color-primary)',
                    }}
                  >
                    {formatCurrency(s.price)}
                  </span>
                </div>

                {/* Service Name */}
                <h3
                  style={{
                    fontSize: '1.12rem',
                    fontWeight: 700,
                    color: isSelected ? 'var(--color-secondary)' : 'var(--color-primary)',
                    marginBottom: '6px',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {s.name}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--color-text-subtle)',
                    lineHeight: 1.45,
                  }}
                >
                  {s.description || 'Dịch vụ chăm sóc và tạo hình chuyên sâu tiêu chuẩn Aura.'}
                </p>
              </div>

              {/* Card Footer: Duration & Specialists badges */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(0,0,0,0.05)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    {formatDuration(s.durationMinutes)}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--color-secondary)',
                      backgroundColor: 'var(--color-accent-subtle)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                      verified
                    </span>
                    Thợ sẵn sàng
                  </span>
                </div>

                {isSelected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-secondary)', fontWeight: 700, fontSize: '0.85rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      check_circle
                    </span>
                    Đang chọn
                  </div>
                ) : (
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Bấm để chọn
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
