import { httpClient } from './httpClient';
import {
  Booking,
  AvailableSlot,
  AvailableSlotsQueryParameters,
  CreateBookingRequest,
  UpdateBookingStatusRequest,
  CancelBookingRequest,
  BookingQueryParameters,
  MyBookingQueryParameters,
} from '@/types/booking';
import { PagedResult } from '@/types/common';

export const bookingService = {
  /**
   * Lấy các khung giờ còn trống của thợ trong ngày theo dịch vụ
   */
  async getAvailableSlots(
    params: AvailableSlotsQueryParameters,
    token?: string
  ): Promise<AvailableSlot[]> {
    const query = new URLSearchParams({
      serviceId: params.serviceId,
      staffId: params.staffId,
      date: params.date,
    });
    return httpClient<AvailableSlot[]>(`/api/bookings/available-slots?${query.toString()}`, {}, token);
  },

  /**
   * Khách hàng tạo mới booking (Đặt lịch)
   * Ném ra ApiError có status 409 nếu bị trùng lịch
   */
  async create(data: CreateBookingRequest): Promise<Booking> {
    return httpClient<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Khách hàng lấy danh sách lịch hẹn của chính mình
   */
  async getMyBookings(
    params?: MyBookingQueryParameters,
    token?: string
  ): Promise<PagedResult<Booking>> {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));

    const qs = query.toString();
    return httpClient<PagedResult<Booking>>(`/api/bookings/my-bookings${qs ? `?${qs}` : ''}`, {}, token);
  },

  /**
   * Admin lấy danh sách toàn bộ booking hệ thống kèm lọc ngày, trạng thái, thợ
   */
  async getAllBookings(
    params?: BookingQueryParameters,
    token?: string
  ): Promise<PagedResult<Booking>> {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.status) query.append('status', params.status);
    if (params?.staffId) query.append('staffId', params.staffId);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));

    const qs = query.toString();
    return httpClient<PagedResult<Booking>>(`/api/bookings${qs ? `?${qs}` : ''}`, {}, token);
  },

  /**
   * Admin cập nhật trạng thái đơn (Confirmed, Completed, Cancelled)
   */
  async updateStatus(id: string, data: UpdateBookingStatusRequest): Promise<Booking> {
    return httpClient<Booking>(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Hủy lịch hẹn kèm lý do bắt buộc (Khách hoặc Admin)
   */
  async cancel(id: string, data: CancelBookingRequest): Promise<Booking> {
    return httpClient<Booking>(`/api/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
