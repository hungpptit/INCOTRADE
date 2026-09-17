import React from 'react';
import { AdminBookingsView } from '@/features/admin/AdminBookingsView';

export const metadata = {
  title: 'Quản Trị Booking - Aura Admin',
  description: 'Bảng quản trị toàn bộ lịch hẹn đặt dịch vụ của hệ thống Aura Wellness.',
};

export default function AdminBookingsPage() {
  return <AdminBookingsView />;
}
