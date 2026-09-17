using ServiceBooking.Api.DTOs.Bookings;
using ServiceBooking.Api.DTOs.Common;

namespace ServiceBooking.Api.Services.Interfaces;

public interface IBookingService
{
    Task<List<AvailableSlotDto>> GetAvailableSlotsAsync(AvailableSlotsQueryParameters parameters);
    Task<BookingDto> CreateBookingAsync(Guid customerId, CreateBookingRequest request);
    Task<PagedResult<BookingDto>> GetMyBookingsAsync(Guid customerId, MyBookingQueryParameters parameters);
    Task<PagedResult<BookingDto>> GetBookingsAsync(BookingQueryParameters parameters);
    Task<BookingDto> GetBookingByIdAsync(Guid id, Guid currentUserId, bool isAdmin);
    Task<BookingDto> UpdateBookingStatusAsync(Guid id, UpdateBookingStatusRequest request);
    Task<BookingDto> CancelBookingAsync(Guid id, Guid currentUserId, bool isAdmin, CancelBookingRequest request);
}
