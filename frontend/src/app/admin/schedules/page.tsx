import React from 'react';
import { AdminSchedulesView } from '@/features/admin/AdminSchedulesView';

export const metadata = {
  title: 'Quản Lý Lịch Làm Việc - Aura Admin',
  description: 'Bảng quản trị lịch làm việc ca trực nhân viên dành cho Quản trị viên.',
};

export default function AdminSchedulesPage() {
  return <AdminSchedulesView />;
}
