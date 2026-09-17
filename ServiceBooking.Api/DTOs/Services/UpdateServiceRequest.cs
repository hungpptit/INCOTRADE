using System.ComponentModel.DataAnnotations;

namespace ServiceBooking.Api.DTOs.Services;

public class UpdateServiceRequest
{
    [Required(ErrorMessage = "Tên dịch vụ không được để trống.")]
    [MaxLength(200, ErrorMessage = "Tên dịch vụ không được vượt quá 200 ký tự.")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Mô tả không được vượt quá 1000 ký tự.")]
    public string? Description { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Thời lượng dịch vụ phải lớn hơn 0 phút.")]
    public int DurationMinutes { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Giá dịch vụ không được âm.")]
    public decimal Price { get; set; }

    public bool IsActive { get; set; }
}
