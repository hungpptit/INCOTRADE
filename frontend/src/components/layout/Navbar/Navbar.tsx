'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { authService } from '@/services/authService';
import { User } from '@/types/auth';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Đọc thông tin user từ client
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, [pathname]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsMobileMenuOpen(false);
    router.push('/login');
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          padding: '0 16px',
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'var(--color-primary)',
            }}
          >
            <Image
              src="/images/logo.png"
              alt="Aura Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--color-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              AURA WELLNESS
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--color-accent)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Hệ thống Đặt lịch
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '8px',
          }}
          className="desktop-nav"
        >
          {user?.role === 'Admin' ? (
            <>
              <NavLink href="/admin/bookings" active={isActive('/admin/bookings')}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>assignment</span>
                <span>Quản trị Booking</span>
              </NavLink>
              <NavLink href="/admin/services" active={isActive('/admin/services')}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>content_cut</span>
                <span>Quản lý Dịch vụ</span>
              </NavLink>
              <NavLink href="/admin/schedules" active={isActive('/admin/schedules')}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>calendar_month</span>
                <span>Lịch làm việc</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink href="/services" active={isActive('/services')}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>spa</span>
                <span>Danh mục Dịch vụ</span>
              </NavLink>
              <NavLink href="/booking" active={isActive('/booking')}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>calendar_add_on</span>
                <span>Đặt lịch ngay</span>
              </NavLink>
              {user && (
                <NavLink href="/my-bookings" active={isActive('/my-bookings')}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>confirmation_number</span>
                  <span>Lịch của tôi</span>
                </NavLink>
              )}
            </>
          )}
        </nav>

        {/* User Status / Login Button (Desktop) */}
        <div style={{ display: 'none', alignItems: 'center', gap: '12px' }} className="desktop-nav">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--color-primary)' }}>
                  {user.fullName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-secondary)', fontWeight: 600 }}>
                  {user.role === 'Admin' ? 'Quản trị viên' : 'Khách hàng'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ padding: '8px 16px', minHeight: '40px', fontSize: '0.9rem' }}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary"
              style={{ minHeight: '44px', padding: '10px 22px' }}
            >
              Đăng nhập
            </Link>
          )}
        </div>

        {/* Hamburger Button for Mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-hamburger-btn"
          aria-label="Mở menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            color: 'var(--color-primary)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            backgroundColor: '#ffffff',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {user?.role === 'Admin' ? (
            <>
              <MobileNavLink
                href="/admin/bookings"
                active={isActive('/admin/bookings')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '8px' }}>assignment</span>
                <span>Quản trị Booking</span>
              </MobileNavLink>
              <MobileNavLink
                href="/admin/services"
                active={isActive('/admin/services')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '8px' }}>content_cut</span>
                <span>Quản lý Dịch vụ</span>
              </MobileNavLink>
              <MobileNavLink
                href="/admin/schedules"
                active={isActive('/admin/schedules')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '8px' }}>calendar_month</span>
                <span>Lịch làm việc</span>
              </MobileNavLink>
            </>
          ) : (
            <>
              <MobileNavLink
                href="/services"
                active={isActive('/services')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '8px' }}>spa</span>
                <span>Danh mục Dịch vụ</span>
              </MobileNavLink>
              <MobileNavLink
                href="/booking"
                active={isActive('/booking')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '8px' }}>calendar_add_on</span>
                <span>Đặt lịch ngay</span>
              </MobileNavLink>
              {user && (
                <MobileNavLink
                  href="/my-bookings"
                  active={isActive('/my-bookings')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '8px' }}>confirmation_number</span>
                  <span>Lịch của tôi</span>
                </MobileNavLink>
              )}
            </>
          )}

          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '14px',
              marginTop: '6px',
            }}
          >
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.95rem', color: 'var(--color-primary)' }}>
                  Xin chào, <strong>{user.fullName}</strong> ({user.role})
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-danger-outline"
                  style={{ width: '100%', minHeight: '48px' }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '48px' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Đăng nhập hệ thống
              </Link>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-hamburger-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: 600,
        color: active ? 'var(--color-accent)' : 'var(--color-text-main)',
        backgroundColor: active ? 'var(--color-accent-light)' : 'transparent',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '1.05rem',
        fontWeight: 600,
        color: active ? 'var(--color-accent)' : 'var(--color-text-main)',
        backgroundColor: active ? 'var(--color-accent-light)' : 'var(--color-surface-hover)',
        display: 'block',
      }}
    >
      {children}
    </Link>
  );
}
