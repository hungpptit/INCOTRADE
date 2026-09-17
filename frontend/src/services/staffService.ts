import { httpClient } from './httpClient';
import {
  Staff,
  StaffQueryParameters,
  CreateStaffRequest,
  UpdateStaffRequest,
  WorkSchedule,
  CreateWorkScheduleRequest,
  ScheduleQueryParameters,
} from '@/types/staff';

export const staffService = {
  /**
   * Lấy danh sách thợ/nhân viên
   */
  async getAll(params?: StaffQueryParameters, token?: string): Promise<Staff[]> {
    const query = new URLSearchParams();
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
    const qs = query.toString();
    return httpClient<Staff[]>(`/api/staffs${qs ? `?${qs}` : ''}`, {}, token);
  },

  /**
   * Lấy chi tiết nhân viên
   */
  async getById(id: string, token?: string): Promise<Staff> {
    return httpClient<Staff>(`/api/staffs/${id}`, {}, token);
  },

  /**
   * Admin tạo mới nhân viên
   */
  async create(data: CreateStaffRequest): Promise<Staff> {
    return httpClient<Staff>('/api/staffs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Admin cập nhật thông tin nhân viên
   */
  async update(id: string, data: UpdateStaffRequest): Promise<Staff> {
    return httpClient<Staff>(`/api/staffs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Lấy danh sách ca làm việc của nhân viên theo khoảng ngày
   */
  async getSchedules(
    staffId: string,
    params?: ScheduleQueryParameters,
    token?: string
  ): Promise<WorkSchedule[]> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString();
    return httpClient<WorkSchedule[]>(`/api/staffs/${staffId}/schedules${qs ? `?${qs}` : ''}`, {}, token);
  },

  /**
   * Admin tạo ca làm việc mới cho nhân viên
   */
  async createSchedule(staffId: string, data: CreateWorkScheduleRequest): Promise<WorkSchedule> {
    return httpClient<WorkSchedule>(`/api/staffs/${staffId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
