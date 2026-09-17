import { Booking, BookingStatus } from '@/types';

/**
 * Kiểm tra xem một Booking có được phép hủy hay không
 * Quy tắc:
 * 1. Không được hủy nếu đã Hoàn thành (Completed) hoặc đã Hủy (Cancelled).
 * 2. Không được hủy nếu thời gian bắt đầu đã diễn ra trong quá khứ (StartTime <= Now).
 */
export function canCancelBooking(booking: Booking): boolean {
  if (booking.status === 'Completed' || booking.status === 'Cancelled') {
    return false;
  }
  const startTime = new Date(booking.startTime).getTime();
  const now = Date.now();
  return startTime > now;
}

/**
 * Kiểm tra xem Admin có thể xác nhận đơn (Pending -> Confirmed) hay không
 */
export function canConfirmBooking(booking: Booking): boolean {
  return booking.status === 'Pending';
}

/**
 * Kiểm tra xem Admin có thể xác nhận hoàn thành (Confirmed -> Completed) hay không
 */
export function canCompleteBooking(booking: Booking): boolean {
  return booking.status === 'Confirmed';
}

/**
 * Trả về cấu hình hiển thị Badge cho từng trạng thái
 */
export function getStatusBadgeConfig(status: BookingStatus): {
  label: string;
  variant: 'pending' | 'confirmed' | 'completed' | 'cancelled';
} {
  switch (status) {
    case 'Pending':
      return { label: 'Chờ duyệt', variant: 'pending' };
    case 'Confirmed':
      return { label: 'Đã xác nhận', variant: 'confirmed' };
    case 'Completed':
      return { label: 'Đã hoàn thành', variant: 'completed' };
    case 'Cancelled':
      return { label: 'Đã hủy', variant: 'cancelled' };
    default:
      return { label: status, variant: 'cancelled' };
  }
}
