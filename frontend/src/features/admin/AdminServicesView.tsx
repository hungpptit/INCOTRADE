'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { Service } from '@/types/service';
import { serviceService } from '@/services/serviceService';
import { formatCurrency, formatDuration } from '@/utils/formatters';
import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { PaginationControls } from '@/components/common/Pagination/PaginationControls';
import { EmptyState, ErrorAlert, LoadingSkeleton } from '@/components/common/Feedback/StateFeedback';

// Zod Schema for Service Creation & Edit (Rule 3)
const serviceFormSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên dịch vụ.'),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive('Thời lượng phải lớn hơn 0 phút.'),
  price: z.number().nonnegative('Giá dịch vụ không được nhỏ hơn 0.'),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

export function AdminServicesView() {
  const [services, setServices] = useState<Service[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    durationMinutes: 45,
    price: 150000,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ServiceFormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Services
  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await serviceService.getAll({
        page: currentPage,
        pageSize,
        search: search.trim() || undefined,
        // Admin xem tất cả, không lọc isActive
      });

      setServices(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMessage(err.message);
      else setErrorMessage('Không thể tải danh mục dịch vụ.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Handle Toggle Active
  const handleToggleActive = async (service: Service) => {
    try {
      await serviceService.update(service.id, {
        name: service.name,
        description: service.description || undefined,
        durationMinutes: service.durationMinutes,
        price: service.price,
        isActive: !service.isActive,
      });
      fetchServices();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái dịch vụ.');
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      durationMinutes: 45,
      price: 150000,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      durationMinutes: service.durationMinutes,
      price: service.price,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = serviceFormSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Partial<Record<keyof ServiceFormData, string>> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof ServiceFormData;
        errors[path] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      if (editingService) {
        await serviceService.update(editingService.id, {
          ...formData,
          isActive: editingService.isActive,
        });
      } else {
        await serviceService.create(formData);
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Thao tác không thành công.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '18px',
        }}
      >
        <div>
          <span
            style={{
              backgroundColor: 'var(--color-info-bg)',
              color: 'var(--color-info)',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.88rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Khu vực Quản trị viên
          </span>
          <h1 style={{ color: 'var(--color-primary)', marginTop: '6px' }}>Quản Lý Danh Mục Dịch Vụ</h1>
          <p style={{ fontSize: '1.02rem', color: 'var(--color-text-muted)' }}>
            Thêm mới, chỉnh sửa thông tin, điều chỉnh giá và khóa/mở dịch vụ.
          </p>
        </div>

        <Button variant="primary" size="lg" onClick={handleOpenCreate}>
          + Thêm Dịch Vụ Mới
        </Button>
      </div>

      {/* Search Filter */}
      <div style={{ display: 'flex', gap: '12px', maxWidth: '480px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Tìm theo tên dịch vụ..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {errorMessage && <ErrorAlert message={errorMessage} onRetry={fetchServices} />}

      {/* Table */}
      {isLoading ? (
        <LoadingSkeleton count={4} type="table-row" />
      ) : services.length === 0 ? (
        <EmptyState
          icon="content_cut"
          title="Chưa có dịch vụ nào"
          description="Hiện tại hệ thống chưa có dữ liệu dịch vụ. Bấm nút bên dưới để tạo dịch vụ đầu tiên."
          action={
            <Button variant="primary" onClick={handleOpenCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              <span>Tạo dịch vụ ngay</span>
            </Button>
          }
        />
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="aura-table">
            <thead>
              <tr>
                <th>TÊN DỊCH VỤ</th>
                <th>THỜI LƯỢNG</th>
                <th>GIÁ TIỀN</th>
                <th>TRẠNG THÁI</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {service.name}
                    </div>
                    {service.description && (
                      <div style={{ fontSize: '0.86rem', color: 'var(--color-text-subtle)', marginTop: '2px' }}>
                        {service.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-text-muted)' }}>schedule</span>
                      <span>{formatDuration(service.durationMinutes)}</span>
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                    {formatCurrency(service.price)}
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        backgroundColor: service.isActive ? 'var(--color-accent-subtle)' : '#f1f5f9',
                        color: service.isActive ? 'var(--color-secondary)' : '#64748b',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: service.isActive ? 'var(--color-secondary)' : '#94a3b8',
                        }}
                      />
                      <span>{service.isActive ? 'Đang mở' : 'Đang khóa'}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <Button variant="outline" size="md" onClick={() => handleOpenEdit(service)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                        <span>Sửa</span>
                      </Button>
                      <Button
                        variant={service.isActive ? 'danger-outline' : 'primary'}
                        size="md"
                        onClick={() => handleToggleActive(service)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {service.isActive ? 'lock' : 'lock_open'}
                        </span>
                        <span>{service.isActive ? 'Khóa' : 'Mở lại'}</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Modal Add / Edit Service */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSaving) setIsModalOpen(false);
        }}
        title={editingService ? 'Chỉnh Sửa Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              onClick={handleFormSubmit}
              isLoading={isSaving}
              loadingText="Đang lưu..."
            >
              {editingService ? 'Lưu Thay Đổi' : 'Tạo Dịch Vụ'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="svcName">
              Tên dịch vụ <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              id="svcName"
              type="text"
              className="form-input"
              placeholder="ví dụ: Combo Cắt Tóc & Massage Đầu"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSaving}
            />
            {formErrors.name && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.88rem' }}>{formErrors.name}</span>
            )}
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="svcDesc">
              Mô tả chi tiết:
            </label>
            <textarea
              id="svcDesc"
              className="form-textarea"
              placeholder="Mô tả quy trình dịch vụ..."
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSaving}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="svcDuration">
                Thời lượng (phút) <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="svcDuration"
                type="number"
                min={5}
                step={5}
                className="form-input"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value, 10) || 0 })}
                disabled={isSaving}
              />
              {formErrors.durationMinutes && (
                <span style={{ color: 'var(--color-error)', fontSize: '0.88rem' }}>{formErrors.durationMinutes}</span>
              )}
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="svcPrice">
                Giá dịch vụ (VNĐ) <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="svcPrice"
                type="number"
                min={0}
                step={10000}
                className="form-input"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value, 10) || 0 })}
                disabled={isSaving}
              />
              {formErrors.price && (
                <span style={{ color: 'var(--color-error)', fontSize: '0.88rem' }}>{formErrors.price}</span>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
