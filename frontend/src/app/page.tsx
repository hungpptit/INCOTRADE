import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {/* Hero Section */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          borderRadius: '20px',
          overflow: 'hidden',
          padding: 'clamp(36px, 5vw, 64px) clamp(24px, 5vw, 48px)',
          boxShadow: 'var(--shadow-xl)',
          minHeight: '440px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, opacity: 0.28 }}>
          <Image
            src="/images/salon-bg.png"
            alt="Salon Sanctuary"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(6px)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#6ee7b7',
              marginBottom: '16px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
            <span>Dịch Vụ Chăm Sóc & Thư Giãn Đẳng Cấp</span>
          </div>

          <h1
            style={{
              color: '#ffffff',
              fontSize: 'clamp(2.1rem, 4vw, 3rem)',
              lineHeight: 1.15,
              marginBottom: '16px',
            }}
          >
            Aura Grooming &amp; Wellness Sanctuary
          </h1>

          <p
            style={{
              color: '#cbd5e1',
              fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
              lineHeight: 1.6,
              marginBottom: '32px',
            }}
          >
            Trải nghiệm đặt lịch nhanh chóng, tiện lợi với khung giờ trực quan theo thời gian thực.
            Phục vụ chuyên nghiệp, tận tâm cho mọi đối tượng khách hàng.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link
              href="/booking"
              className="btn btn-secondary btn-lg"
              style={{ padding: '14px 28px', fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>ĐẶT LỊCH HẸN NGAY</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
            </Link>
            <Link
              href="/services"
              className="btn btn-outline"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                padding: '14px 24px',
                fontSize: '1.05rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>spa</span>
              <span>Xem Bảng Dịch Vụ</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Core Values / Features */}
      <div className="grid-3">
        <div className="aura-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-surface-low)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-secondary)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>format_list_numbered</span>
          </div>
          <h3 style={{ fontSize: '1.2rem' }}>Quy Trình Đặt Lịch Rõ Ràng</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.94rem', lineHeight: 1.55 }}>
            Giao diện chữ to, nút bấm lớn, đánh số thứ tự tuần tự giúp người trung niên và mọi khách hàng thao tác dễ dàng không nhầm lẫn.
          </p>
        </div>

        <div className="aura-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-surface-low)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-secondary)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>bolt</span>
          </div>
          <h3 style={{ fontSize: '1.2rem' }}>Chống Trùng Lịch Tuyệt Đối</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.94rem', lineHeight: 1.55 }}>
            Khóa hàng Database độc quyền chống xung đột khung giờ, phản hồi tức thời mã lỗi HTTP 409 nếu có khách đặt trước.
          </p>
        </div>

        <div className="aura-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-surface-low)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-secondary)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>confirmation_number</span>
          </div>
          <h3 style={{ fontSize: '1.2rem' }}>Quản Lý & Hủy Lịch Minh Bạch</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.94rem', lineHeight: 1.55 }}>
            Theo dõi trạng thái đơn hẹn trực quan, dễ dàng hủy lịch trước giờ hẹn và tự động giải phóng chỗ cho khách khác.
          </p>
        </div>
      </div>

      {/* Quick Login Helper Callout */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.18rem', color: 'var(--color-primary)', marginBottom: '4px' }}>
            Bạn đang kiểm thử bài đánh giá Full-Stack Demo?
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Hệ thống đã chuẩn bị sẵn 3 tài khoản Demo (Admin, Khách 1, Khách 2). Bấm vào để thử nghiệm nhanh.
          </p>
        </div>

        <Link
          href="/login"
          className="btn btn-primary"
          style={{ minHeight: '46px', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span>Vào Trang Đăng Nhập</span>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
        </Link>
      </div>
    </div>
  );
}

