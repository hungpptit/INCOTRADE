/**
 * Format số tiền sang định dạng Việt Nam Đồng (VND)
 * Ví dụ: 150000 -> "150.000 ₫"
 */
export function formatCurrency(amount?: number | null): string {
  if (amount == null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format chuỗi ISO DateTime thành định dạng ngày Việt Nam
 * Ví dụ: "2026-09-25T09:30:00Z" -> "25/09/2026"
 */
export function formatDate(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Format chuỗi ISO DateTime thành giờ:phút
 * Ví dụ: "2026-09-25T09:30:00Z" -> "09:30"
 */
export function formatTime(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Format chuỗi ISO DateTime thành cả ngày và giờ
 * Ví dụ: "09:30 - 25/09/2026"
 */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '';
  return `${formatTime(isoString)} - ${formatDate(isoString)}`;
}

/**
 * Format thời lượng phút sang chuỗi hiển thị
 * Ví dụ: 60 -> "60 phút"
 */
export function formatDuration(minutes?: number | null): string {
  if (!minutes) return '0 phút';
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
}
