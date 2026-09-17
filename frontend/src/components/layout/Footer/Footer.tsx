import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-primary)',
        color: '#ffffff',
        padding: '40px 16px 24px',
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '32px',
          marginBottom: '32px',
        }}
      >
        {/* Brand Column */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '12px' }}>
            AURA WELLNESS &amp; GROOMING
          </h4>
          <p style={{ color: '#94a3b8', fontSize: '0.94rem', lineHeight: 1.6 }}>
            Hệ thống đặt lịch dịch vụ chăm sóc và thư giãn cao cấp. Đem lại trải nghiệm
            tiện nghi, nhanh chóng và chính xác cho mọi đối tượng khách hàng.
          </p>
        </div>

        {/* Operating Hours */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6ee7b7' }}>
              schedule
            </span>
            <span>Giờ Mở Cửa Phục Vụ</span>
          </h4>
          <p style={{ color: '#cbd5e1', fontSize: '0.94rem', lineHeight: 1.6 }}>
            Thứ Hai - Chủ Nhật: <strong>08:30 - 21:00</strong>
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginTop: '6px' }}>
            Hotline hỗ trợ: <strong style={{ color: '#ffffff' }}>1900 8888</strong>
          </p>
        </div>

        {/* Quick Demo Info */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6ee7b7' }}>
              info
            </span>
            <span>Tài khoản Kiểm thử (Demo)</span>
          </h4>
          <div style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
            <div>Admin: <code>admin@booking.com</code></div>
            <div>Khách: <code>customer1@gmail.com</code></div>
            <div>Mật khẩu chung: <code>Demo@123456</code></div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '20px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.88rem',
        }}
      >
        © {new Date().getFullYear()} Aura Grooming &amp; Wellness Sanctuary. Bản quyền thuộc về đề án Full-Stack Demo.
      </div>
    </footer>
  );
}
