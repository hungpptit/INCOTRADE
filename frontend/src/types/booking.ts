export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface AvailableSlot {
  startTime: string;   // ISO UTC format
  endTime: string;     // ISO UTC format
}

export interface AvailableSlotsQueryParameters {
  serviceId: string;
  staffId: string;
  date: string;        // yyyy-MM-dd
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  serviceId: string;
  serviceName?: string;
  servicePrice?: number;
  durationMinutes?: number;
  staffId: string;
  staffName?: string;
  startTime: string;   // ISO UTC
  endTime: string;     // ISO UTC
  status: BookingStatus;
  customerNote?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
}

export interface CreateBookingRequest {
  serviceId: string;
  staffId: string;
  startTime: string;   // ISO UTC
  customerNote?: string;
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
  cancellationReason?: string;
}

export interface CancelBookingRequest {
  cancellationReason: string;
}

export interface BookingQueryParameters {
  date?: string;
  status?: BookingStatus;
  staffId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface MyBookingQueryParameters {
  date?: string;
  status?: BookingStatus;
  page?: number;
  pageSize?: number;
}
