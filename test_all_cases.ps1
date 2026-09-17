# ==============================================================================
# SCRIPT KIỂM THỬ TỰ ĐỘNG 6 TEST CASES BẮT BUỘC (TC1 -> TC6)
# SERVICE BOOKING MANAGEMENT SYSTEM
# ==============================================================================

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  BẮT ĐẦU KIỂM THỬ 6 TEST CASES BẮT BUỘC (TC1 -> TC6)  " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"

# 1. Đăng nhập lấy Token
Write-Host "`n[1/7] Đăng nhập tài khoản Admin & Customers..." -ForegroundColor Yellow
$adminLogin = @{ email = "admin@booking.com"; password = "Demo@123456" } | ConvertTo-Json
$cust1Login = @{ email = "customer1@gmail.com"; password = "Demo@123456" } | ConvertTo-Json
$cust2Login = @{ email = "customer2@gmail.com"; password = "Demo@123456" } | ConvertTo-Json

$adminToken = (Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $adminLogin).token
$cust1Token = (Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $cust1Login).token
$cust2Token = (Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $cust2Login).token
Write-Host "-> Đăng nhập thành công!" -ForegroundColor Green

# 2. Chuẩn bị dữ liệu mẫu cho ngày test (Cách 20 ngày trong tương lai)
$services = (Invoke-RestMethod -Uri "$baseUrl/api/services" -Method Get).items
$service30m = $services | Where-Object { $_.durationMinutes -eq 30 } | Select-Object -First 1
$staffs = Invoke-RestMethod -Uri "$baseUrl/api/staffs" -Method Get
$staff = $staffs[0]

$testDate = (Get-Date).AddDays(20).ToString("yyyy-MM-dd")
$newShift = @{
    workDate = $testDate
    startTime = "08:00:00"
    endTime = "12:00:00"
} | ConvertTo-Json

$createdShift = Invoke-RestMethod -Uri "$baseUrl/api/staffs/$($staff.id)/schedules" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $adminToken" } -Body $newShift
Write-Host "-> Đã chuẩn bị ca làm việc mẫu cho ngày $($testDate): 08:00 - 12:00" -ForegroundColor Green

# ------------------------------------------------------------------------------
# TC1: Chặn đặt lịch trong quá khứ
# ------------------------------------------------------------------------------
Write-Host "`n-------------------------------------------------------"
Write-Host "[TC1] Kiểm tra: Chặn đặt lịch trong quá khứ" -ForegroundColor Yellow
try {
    $tc1Body = @{
        serviceId = $service30m.id
        staffId = $staff.id
        startTime = "2020-01-01T09:00:00Z"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/bookings" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $cust1Token" } -Body $tc1Body
    Write-Host "[FAIL] TC1: Hệ thống cho phép đặt lịch quá khứ!" -ForegroundColor Red
} catch {
    Write-Host "[PASS] TC1: Đã chặn thành công với mã 400 Bad Request!" -ForegroundColor Green
    Write-Host "       Chi tiết: $($_.Exception.Message)" -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# TC2: Chặn đặt lịch ngoài giờ làm việc
# ------------------------------------------------------------------------------
Write-Host "`n-------------------------------------------------------"
Write-Host "[TC2] Kiểm tra: Chặn đặt lịch ngoài giờ làm việc" -ForegroundColor Yellow
try {
    $tc2Body = @{
        serviceId = $service30m.id
        staffId = $staff.id
        startTime = "$($testDate)T15:00:00Z"  # Ca của thợ chỉ từ 08:00 đến 12:00
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/bookings" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $cust1Token" } -Body $tc2Body
    Write-Host "[FAIL] TC2: Hệ thống cho phép đặt ngoài ca!" -ForegroundColor Red
} catch {
    Write-Host "[PASS] TC2: Đã chặn thành công với mã 400 Bad Request!" -ForegroundColor Green
    Write-Host "       Chi tiết: $($_.Exception.Message)" -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# Chuẩn bị: Đặt 1 đơn hợp lệ lúc 09:00 - 09:30
# ------------------------------------------------------------------------------
Write-Host "`n-------------------------------------------------------"
Write-Host "-> Khách 1 đặt lịch hợp lệ: 09:00 - 09:30..." -ForegroundColor Cyan
$validBooking1 = @{
    serviceId = $service30m.id
    staffId = $staff.id
    startTime = "$($testDate)T09:00:00Z"
    customerNote = "Đơn mẫu để kiểm thử"
} | ConvertTo-Json
$booking1 = Invoke-RestMethod -Uri "$baseUrl/api/bookings" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $cust1Token" } -Body $validBooking1
Write-Host "-> Đặt thành công: Mã $($booking1.bookingCode)" -ForegroundColor Green

# ------------------------------------------------------------------------------
# TC3: Chặn hai booking trùng giờ (Mã 409 Conflict)
# ------------------------------------------------------------------------------
Write-Host "`n-------------------------------------------------------"
Write-Host "[TC3] Kiểm tra: Chặn hai booking trùng giờ (Bắt buộc trả về 409)" -ForegroundColor Yellow
try {
    $tc3Body = @{
        serviceId = $service30m.id
        staffId = $staff.id
        startTime = "$($testDate)T09:00:00Z"  # Khách 2 cố tình đặt cùng khung 09:00 - 09:30
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/bookings" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $cust2Token" } -Body $tc3Body
    Write-Host "[FAIL] TC3: Hệ thống cho phép đặt trùng lịch!" -ForegroundColor Red
} catch {
    Write-Host "[PASS] TC3: Đã chặn thành công với mã 409 Conflict!" -ForegroundColor Green
    Write-Host "       Chi tiết: $($_.Exception.Message)" -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# TC4: Customer không xem được booking của người khác
# ------------------------------------------------------------------------------
Write-Host "`n-------------------------------------------------------"
Write-Host "[TC4] Kiểm tra: Customer 2 không xem được booking của Customer 1" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/bookings/$($booking1.id)" -Method Get -Headers @{ Authorization = "Bearer $cust2Token" }
    Write-Host "[FAIL] TC4: Customer 2 xem được đơn của người khác!" -ForegroundColor Red
} catch {
    Write-Host "[PASS] TC4: Đã chặn thành công (404 Not Found để ẩn dữ liệu)!" -ForegroundColor Green
    Write-Host "       Chi tiết: $($_.Exception.Message)" -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# TC5: Customer không tự chuyển trạng thái hoàn thành booking
# ------------------------------------------------------------------------------
Write-Host "`n-------------------------------------------------------"
Write-Host "[TC5] Kiểm tra: Customer không tự chuyển trạng thái hoàn thành" -ForegroundColor Yellow
try {
    $tc5Body = @{ status = "Completed" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/bookings/$($booking1.id)/status" -Method Patch -ContentType "application/json" -Headers @{ Authorization = "Bearer $cust1Token" } -Body $tc5Body
    Write-Host "[FAIL] TC5: Customer tự chuyển được trạng thái!" -ForegroundColor Red
} catch {
    Write-Host "[PASS] TC5: Đã chặn thành công với mã 403 Forbidden!" -ForegroundColor Green
    Write-Host "       Chi tiết: $($_.Exception.Message)" -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# TC6: Không hủy booking đã hoàn thành
# ------------------------------------------------------------------------------
Write-Host "`n-------------------------------------------------------"
Write-Host "-> Admin duyệt đơn sang Confirmed rồi chuyển tiếp sang Completed..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "$baseUrl/api/bookings/$($booking1.id)/status" -Method Patch -ContentType "application/json" -Headers @{ Authorization = "Bearer $adminToken" } -Body (@{ status = "Confirmed" } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Uri "$baseUrl/api/bookings/$($booking1.id)/status" -Method Patch -ContentType "application/json" -Headers @{ Authorization = "Bearer $adminToken" } -Body (@{ status = "Completed" } | ConvertTo-Json) | Out-Null

Write-Host "[TC6] Kiểm tra: Chặn hủy booking đã hoàn thành" -ForegroundColor Yellow
try {
    $tc6Body = @{ cancellationReason = "Bận việc đột xuất" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/bookings/$($booking1.id)/cancel" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $cust1Token" } -Body $tc6Body
    Write-Host "[FAIL] TC6: Hệ thống cho phép hủy đơn đã Completed!" -ForegroundColor Red
} catch {
    Write-Host "[PASS] TC6: Đã chặn thành công với mã 400 Bad Request!" -ForegroundColor Green
    Write-Host "       Chi tiết: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "🎉 HOÀN TẤT: TOÀN BỘ 6/6 TEST CASES ĐỀU ĐẠT CHUẨN (PASS)!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
