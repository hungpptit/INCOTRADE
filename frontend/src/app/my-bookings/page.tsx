import React from 'react';
import { MyBookingsView } from '@/features/my-bookings/MyBookingsView';

export const metadata = {
  title: 'Lịch Hẹn Của Tôi - Aura Wellness',
  description: 'Xem, lọc và quản lý danh sách lịch hẹn chăm sóc cá nhân của bạn.',
};

export default function MyBookingsPage() {
  return <MyBookingsView />;
}
