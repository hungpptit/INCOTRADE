import React from 'react';
import { AdminServicesView } from '@/features/admin/AdminServicesView';

export const metadata = {
  title: 'Quản Lý Dịch Vụ - Aura Admin',
  description: 'Bảng quản trị danh mục dịch vụ dành cho Quản trị viên Aura Wellness.',
};

export default function AdminServicesPage() {
  return <AdminServicesView />;
}
