import { httpClient } from './httpClient';
import {
  Service,
  ServiceQueryParameters,
  CreateServiceRequest,
  UpdateServiceRequest,
} from '@/types/service';
import { PagedResult } from '@/types/common';

export const serviceService = {
  /**
   * Lấy danh sách dịch vụ kèm tìm kiếm và phân trang
   */
  async getAll(params?: ServiceQueryParameters, token?: string): Promise<PagedResult<Service>> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));

    const qs = query.toString();
    return httpClient<PagedResult<Service>>(`/api/services${qs ? `?${qs}` : ''}`, {}, token);
  },

  /**
   * Lấy thông tin chi tiết 1 dịch vụ
   */
  async getById(id: string, token?: string): Promise<Service> {
    return httpClient<Service>(`/api/services/${id}`, {}, token);
  },

  /**
   * Admin tạo mới dịch vụ
   */
  async create(data: CreateServiceRequest): Promise<Service> {
    return httpClient<Service>('/api/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Admin cập nhật hoặc khóa/mở dịch vụ
   */
  async update(id: string, data: UpdateServiceRequest): Promise<Service> {
    return httpClient<Service>(`/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
