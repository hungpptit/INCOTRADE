'use client';

import React from 'react';
import Image from 'next/image';
import { Staff } from '@/types/staff';

interface StaffStepProps {
  staffs: Staff[];
  selectedStaffId: string | null;
  onSelect: (staff: Staff) => void;
}

export function StaffStep({ staffs, selectedStaffId, onSelect }: StaffStepProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header of Step 2 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="step-badge">2</span>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>
              Chọn Chuyên Viên Phục Vụ
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-subtle)' }}>
              Quý khách vui lòng chọn chuyên viên chăm sóc đồng hành
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: '0.82rem',
            color: 'var(--color-secondary)',
            backgroundColor: 'var(--color-accent-subtle)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600,
          }}
        >
          {staffs.length} chuyên viên đang trực
        </span>
      </div>

      {/* Grid of Specialists */}
      <div className="grid-2">
        {staffs.map((staff, idx) => {
          const isSelected = selectedStaffId === staff.id;
          const roleTitle = idx === 0 ? 'Master Barber • Ghế 1' : 'Chuyên viên Chăm sóc & Tạo mẫu';

          return (
            <div
              key={staff.id}
              onClick={() => onSelect(staff)}
              className={`aura-card aura-card-interactive ${isSelected ? 'aura-card-selected' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '18px 20px',
                cursor: 'pointer',
              }}
            >
              {/* Avatar with Online Dot */}
              <div style={{ position: 'relative', width: '58px', height: '58px', flexShrink: 0 }}>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: isSelected ? '2.5px solid var(--color-secondary)' : '2px solid #e2e8f0',
                    backgroundColor: '#e2e8f0',
                    position: 'relative',
                  }}
                >
                  <Image
                    src="/images/barber-avatar.png"
                    alt={staff.fullName}
                    fill
                    sizes="58px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                {/* Green Status Online Dot */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '1px',
                    right: '1px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-secondary)',
                    border: '2.5px solid #ffffff',
                  }}
                />
              </div>

              {/* Staff Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3
                    style={{
                      fontSize: '1.08rem',
                      fontWeight: 700,
                      color: isSelected ? 'var(--color-secondary)' : 'var(--color-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {staff.fullName}
                  </h3>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '16px', color: 'var(--color-secondary)' }}
                  >
                    verified
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--color-text-subtle)', marginTop: '2px' }}>
                  {roleTitle}
                </div>
                {isSelected && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--color-secondary)',
                      backgroundColor: 'var(--color-accent-subtle)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    Đang chọn phục vụ
                  </span>
                )}
              </div>

              {/* Selection Check Icon */}
              <div style={{ flexShrink: 0, color: isSelected ? 'var(--color-secondary)' : '#cbd5e1' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                  {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
