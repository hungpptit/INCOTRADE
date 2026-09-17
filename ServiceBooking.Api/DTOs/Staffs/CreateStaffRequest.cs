using System.ComponentModel.DataAnnotations;

namespace ServiceBooking.Api.DTOs.Staffs;

public class CreateStaffRequest
{
    [Required(ErrorMessage = "Họ và tên nhân viên không được để trống.")]
    [MaxLength(100, ErrorMessage = "Họ và tên không được vượt quá 100 ký tự.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email không được để trống.")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
    [MaxLength(150, ErrorMessage = "Email không được vượt quá 150 ký tự.")]
    public string Email { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
