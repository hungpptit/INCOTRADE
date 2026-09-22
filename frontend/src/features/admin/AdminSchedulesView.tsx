'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { Staff, WorkSchedule } from '@/types/staff';
import { staffService } from '@/services/staffService';
import { formatDate } from '@/utils/formatters';
import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { ConflictAlert, EmptyState, ErrorAlert, LoadingSkeleton } from '@/components/common/Feedback/StateFeedback';
import { PaginationControls } from '@/components/common/Pagination/PaginationControls';

// Zod Schema for WorkShift
const shiftSchema = z
  .object({
    workDate: z.string().min(1, 'Vui lòng chọn ngày làm việc.'),
    startTime: z.string().min(1, 'Vui lòng chọn giờ bắt đầu.'),
    endTime: z.string().min(1, 'Vui lòng chọn giờ kết thúc.'),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Giờ bắt đầu ca phải nhỏ hơn giờ kết thúc ca.',
    path: ['endTime'],
  });

type ShiftFormData = z.infer<typeof shiftSchema>;

// Zod Schema for Staff
const staffSchema = z.object({
  fullName: z.string().min(2, 'Họ tên nhân viên tối thiểu 2 ký tự.'),
  email: z.string().email('Email không đúng định dạng.'),
});

type StaffFormData = z.infer<typeof staffSchema>;

export function AdminSchedulesView() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination State (8 ca trực / trang)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;
  const totalCount = schedules.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedSchedules = schedules.slice(
    (validPage - 1) * PAGE_SIZE,
    validPage * PAGE_SIZE
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<ShiftFormData>({
    workDate: todayStr,
    startTime: '08:30',
    endTime: '17:30',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ShiftFormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [modalConflictError, setModalConflictError] = useState<string | null>(null);

  // Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffFormData, setStaffFormData] = useState<StaffFormData>({
    fullName: '',
    email: '',
  });
  const [staffFormErrors, setStaffFormErrors] = useState<Partial<Record<keyof StaffFormData, string>>>({});
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [staffModalError, setStaffModalError] = useState<string | null>(null);

  // 1. Fetch Staffs
  useEffect(() => {
    async function loadStaffs() {
      try {
        const list = await staffService.getAll();
        setStaffs(list);
        if (list.length > 0) {
          setSelectedStaffId(list[0].id);
        }
      } catch (err: unknown) {
        if (err instanceof Error) setErrorMessage(err.message);
      }
    }
    loadStaffs();
  }, []);

  // 2. Fetch Schedules for selected staff
  const fetchSchedules = useCallback(async () => {
    if (!selectedStaffId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const list = await staffService.getSchedules(selectedStaffId);
      setSchedules(list);
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMessage(err.message);
      else setErrorMessage('Không thể tải lịch làm việc của nhân viên.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStaffId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Handle Submit Shift
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalConflictError(null);

    const validation = shiftSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Partial<Record<keyof ShiftFormData, string>> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof ShiftFormData;
        errors[path] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await staffService.createSchedule(selectedStaffId, {
        workDate: formData.workDate,
        startTime: `${formData.startTime}:00`,
        endTime: `${formData.endTime}:00`,
      });

      setIsModalOpen(false);
      fetchSchedules();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalConflictError(err.message);
      } else {
        setModalConflictError('Không thể thêm ca làm việc.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Submit New Staff
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffModalError(null);

    const validation = staffSchema.safeParse(staffFormData);
    if (!validation.success) {
      const errors: Partial<Record<keyof StaffFormData, string>> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof StaffFormData;
        errors[path] = issue.message;
      });
      setStaffFormErrors(errors);
      return;
    }

    setIsSavingStaff(true);
    try {
      const newStaff = await staffService.create({
        fullName: staffFormData.fullName.trim(),
        email: staffFormData.email.trim(),
      });

      setStaffs((prev) => [...prev, newStaff]);
      setSelectedStaffId(newStaff.id);
      setIsStaffModalOpen(false);
      setStaffFormData({ fullName: '', email: '' });
      setStaffFormErrors({});
    } catch (err: unknown) {
      if (err instanceof Error) {
        setStaffModalError(err.message);
      } else {
        setStaffModalError('Không thể tạo nhân viên mới.');
      }
    } finally {
      setIsSavingStaff(false);
    }
  };

  const currentStaff = staffs.find((s) => s.id === selectedStaffId);

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
          <h1 style={{ color: 'var(--color-primary)', marginTop: '6px' }}>
            Quản Lý Lịch Làm Việc (Ca Trực Thợ)
          </h1>
          <p style={{ fontSize: '1.02rem', color: 'var(--color-text-muted)' }}>
            Thiết lập ca trực làm việc theo ngày cho từng thợ phục vụ. Chặn tạo ca trùng lặp.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setStaffModalError(null);
              setStaffFormErrors({});
              setStaffFormData({ fullName: '', email: '' });
              setIsStaffModalOpen(true);
            }}
          >
            + Thêm Nhân Viên
          </Button>

          <Button
            variant="primary"
            size="lg"
            disabled={!selectedStaffId}
            onClick={() => {
              setModalConflictError(null);
              setFormErrors({});
              setIsModalOpen(true);
            }}
          >
            + Thêm Ca Làm Việc
          </Button>
        </div>
      </div>

      {/* Staff Selector Filter */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <label
          htmlFor="staffSelect"
          className="form-label"
          style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--color-primary)', margin: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            person
          </span>
          <span>Chọn Nhân viên:</span>
        </label>
        <select
          id="staffSelect"
          className="form-select"
          style={{ maxWidth: '300px', fontWeight: 600 }}
          value={selectedStaffId}
          onChange={(e) => {
            setSelectedStaffId(e.target.value);
            setCurrentPage(1);
          }}
        >
          {staffs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.isActive ? 'Đang hoạt động' : 'Đang khóa'})
            </option>
          ))}
        </select>
      </div>

      {errorMessage && <ErrorAlert message={errorMessage} onRetry={fetchSchedules} />}

      {/* Schedule Table / Grid */}
      {isLoading ? (
        <LoadingSkeleton count={4} type="table-row" />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon="calendar_month"
          title={`Chưa có ca làm việc nào cho ${currentStaff?.fullName || 'nhân viên này'}`}
          description="Hiện tại nhân viên này chưa được phân bổ ca trực nào. Bấm nút bên dưới để tạo ca làm việc đầu tiên."
          action={
            <Button variant="primary" onClick={() => setIsModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              <span>Thêm ca làm việc ngay</span>
            </Button>
          }
        />
      ) : (
        <>
          <div className="table-card">
          <div className="table-responsive">
            <table className="aura-table">
              <thead>
                <tr>
                  <th>NGÀY LÀM VIỆC</th>
                  <th>GIỜ BẮT ĐẦU</th>
                  <th>GIỜ KẾT THÚC</th>
                  <th>THỜI LƯỢNG CA</th>
                  <th>NHÂN VIÊN</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSchedules.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-secondary)' }}>
                          calendar_today
                        </span>
                        <span>{formatDate(item.workDate)}</span>
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>
                      {item.startTime}
                    </td>
                    <td style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>
                      {item.endTime}
                    </td>
                    <td>
                      <span
                        style={{
                          backgroundColor: '#f1f5f9',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                        }}
                      >
                        {item.startTime.substring(0, 5)} - {item.endTime.substring(0, 5)}
                      </span>
                    </td>
                    <td>{currentStaff?.fullName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={validPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={(page) => setCurrentPage(page)}
          isLoading={isLoading}
        />
      </>
    )}

      {/* Modal Add Shift */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSaving) setIsModalOpen(false);
        }}
        title={`Thêm Ca Làm Việc cho ${currentStaff?.fullName || 'Nhân viên'}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveShift}
              isLoading={isSaving}
              loadingText="Đang lưu ca..."
            >
              Lưu Ca Làm Việc
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveShift} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {modalConflictError && <ConflictAlert message={modalConflictError} />}

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="workDate">
              Ngày làm việc <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              id="workDate"
              type="date"
              className="form-input"
              min={todayStr}
              value={formData.workDate}
              onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
              disabled={isSaving}
            />
            {formErrors.workDate && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.88rem' }}>{formErrors.workDate}</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="startTime">
                Giờ bắt đầu <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="startTime"
                type="time"
                className="form-input"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                disabled={isSaving}
              />
              {formErrors.startTime && (
                <span style={{ color: 'var(--color-error)', fontSize: '0.88rem' }}>{formErrors.startTime}</span>
              )}
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="endTime">
                Giờ kết thúc <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="endTime"
                type="time"
                className="form-input"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                disabled={isSaving}
              />
              {formErrors.endTime && (
                <span style={{ color: 'var(--color-error)', fontSize: '0.88rem' }}>{formErrors.endTime}</span>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Add Staff */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => {
          if (!isSavingStaff) setIsStaffModalOpen(false);
        }}
        title="Thêm Nhân Viên Mới"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsStaffModalOpen(false)} disabled={isSavingStaff}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveStaff}
              isLoading={isSavingStaff}
              loadingText="Đang lưu nhân viên..."
            >
              Lưu Nhân Viên
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {staffModalError && <ConflictAlert message={staffModalError} />}

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="staffFullName">
              Họ và tên nhân viên <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              id="staffFullName"
              type="text"
              className="form-input"
              placeholder="Ví dụ: Lê Văn C"
              value={staffFormData.fullName}
              onChange={(e) => setStaffFormData({ ...staffFormData, fullName: e.target.value })}
              disabled={isSavingStaff}
            />
            {staffFormErrors.fullName && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.88rem' }}>{staffFormErrors.fullName}</span>
            )}
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="staffEmail">
              Email nhân viên <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              id="staffEmail"
              type="email"
              className="form-input"
              placeholder="staff3@booking.com"
              value={staffFormData.email}
              onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
              disabled={isSavingStaff}
            />
            {staffFormErrors.email && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.88rem' }}>{staffFormErrors.email}</span>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
