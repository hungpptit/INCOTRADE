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

$testDate = (Get-Date).AddDays(4).ToString("yyyy-MM-dd")
$newShift = @{
    workDate = $testDate
    startTime = "08:00:00"
    endTime = "12:00:00"
} | ConvertTo-Json

try {
    $createdShift = Invoke-RestMethod -Uri "$baseUrl/api/staffs/$($staff.id)/schedules" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $adminToken" } -Body $newShift
    Write-Host "-> Đã chuẩn bị ca làm việc mẫu cho ngày $($testDate): 08:00 - 12:00" -ForegroundColor Green
} catch {
    Write-Host "-> Ca làm việc ngày $($testDate) đã tồn tại sẵn, tiếp tục kiểm thử." -ForegroundColor Cyan
}

$passedCount = 0
$failedCount = 0

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
    $failedCount++
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) {
        Write-Host "[PASS] TC1: Đã chặn thành công với mã 400 Bad Request!" -ForegroundColor Green
        $passedCount++
    } else {
        Write-Host "[FAIL] TC1: Mong đợi 400 nhưng nhận mã: $code" -ForegroundColor Red
        $failedCount++
    }
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
    $failedCount++
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) {
        Write-Host "[PASS] TC2: Đã chặn thành công với mã 400 Bad Request!" -ForegroundColor Green
        $passedCount++
    } else {
        Write-Host "[FAIL] TC2: Mong đợi 400 nhưng nhận mã: $code" -ForegroundColor Red
        $failedCount++
    }
}

# ------------------------------------------------------------------------------
# Chuẩn bị: Tìm slot trống và đặt 1 đơn hợp lệ cho Khách 1
# ------------------------------------------------------------------------------
Write-Host "`n-------------------------------------------------------"
$slots = Invoke-RestMethod -Uri "$baseUrl/api/bookings/available-slots?staffId=$($staff.id)&serviceId=$($service30m.id)&date=$testDate" -Method Get
$targetSlot = $slots | Where-Object { $_.isAvailable -eq $true } | Select-Object -First 1

if (-not $targetSlot) {
    Write-Host "[WARN] Không còn slot trống trong ngày $testDate, tạo ca mới..." -ForegroundColor Yellow
    $testDate = (Get-Date).AddDays(5).ToString("yyyy-MM-dd")
    $newShift2 = @{ workDate = $testDate; startTime = "08:00:00"; endTime = "12:00:00" } | ConvertTo-Json
    try { Invoke-RestMethod -Uri "$baseUrl/api/staffs/$($staff.id)/schedules" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $adminToken" } -Body $newShift2 | Out-Null } catch {}
    $slots = Invoke-RestMethod -Uri "$baseUrl/api/bookings/available-slots?staffId=$($staff.id)&serviceId=$($service30m.id)&date=$testDate" -Method Get
    $targetSlot = $slots | Where-Object { $_.isAvailable -eq $true } | Select-Object -First 1
}

$slotTime = $targetSlot.startTime
Write-Host "-> Khách 1 đặt lịch hợp lệ tại khung giờ: $slotTime..." -ForegroundColor Cyan
$validBooking1 = @{
    serviceId = $service30m.id
    staffId = $staff.id
    startTime = $slotTime
    customerNote = "Đơn mẫu để kiểm thử tự động"
} | ConvertTo-Json
$booking1 = Invoke-RestMethod -Uri "$baseUrl/api/bookings" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $cust1Token" } -Body $validBooking1
Write-Host "-> Đặt thành công: Mã $($booking1.bookingCode) (ID: $($booking1.id))" -ForegroundColor Green

# ------------------------------------------------------------------------------
# TC3: Chặn hai booking trùng giờ (Bắt buộc trả về 409 Conflict)
# ------------------------------------------------------------------------------
Write-Host "`n-------------------------------------------------------"
Write-Host "[TC3] Kiểm tra: Chặn hai booking trùng giờ (Bắt buộc trả về 409)" -ForegroundColor Yellow
try {
    $tc3Body = @{
        serviceId = $service30m.id
        staffId = $staff.id
        startTime = $slotTime  # Khách 2 cố tình đặt cùng khung giờ vừa đặt
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/bookings" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $cust2Token" } -Body $tc3Body
    Write-Host "[FAIL] TC3: Hệ thống cho phép đặt trùng lịch!" -ForegroundColor Red
    $failedCount++
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 409) {
        Write-Host "[PASS] TC3: Đã chặn thành công với mã 409 Conflict!" -ForegroundColor Green
        $passedCount++
    } else {
        Write-Host "[FAIL] TC3: Mong đợi 409 nhưng nhận mã: $code" -ForegroundColor Red
        $failedCount++
    }
}

# ------------------------------------------------------------------------------
# TC4: Customer không xem được booking của người khác
# ------------------------------------------------------------------------------
Write-Host "`n-------------------------------------------------------"
Write-Host "[TC4] Kiểm tra: Customer 2 không xem được booking của Customer 1" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/bookings/$($booking1.id)" -Method Get -Headers @{ Authorization = "Bearer $cust2Token" }
    Write-Host "[FAIL] TC4: Customer 2 xem được đơn của người khác!" -ForegroundColor Red
    $failedCount++
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 404) {
        Write-Host "[PASS] TC4: Đã chặn thành công (404 Not Found để ẩn dữ liệu)!" -ForegroundColor Green
        $passedCount++
    } else {
        Write-Host "[FAIL] TC4: Mong đợi 404 nhưng nhận mã: $code" -ForegroundColor Red
        $failedCount++
    }
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
    $failedCount++
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 403) {
        Write-Host "[PASS] TC5: Đã chặn thành công với mã 403 Forbidden!" -ForegroundColor Green
        $passedCount++
    } else {
        Write-Host "[FAIL] TC5: Mong đợi 403 nhưng nhận mã: $code" -ForegroundColor Red
        $failedCount++
    }
}

# ------------------------------------------------------------------------------
# TC6: Không hủy booking đã hoàn thành
# ------------------------------------------------------------------------------
Write-Host "`n-------------------------------------------------------"
Write-Host "-> Admin duyệt đơn sang Confirmed rồi chuyển tiếp sang Completed..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "$baseUrl/api/bookings/$($booking1.id)/status" -Method Patch -ContentType "application/json" -Headers @{ Authorization = "Bearer $adminToken" } -Body (@{ status = "Confirmed" } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Uri "$baseUrl/api/bookings/$($booking1.id)/status" -Method Patch -ContentType "application/json" -Headers @{ Authorization = "Bearer $adminToken" } -Body (@{ status = "Completed" } | ConvertTo-Json) | Out-Null
Write-Host "-> Admin đã cập nhật trạng thái đơn thành Completed thành công!" -ForegroundColor Green

Write-Host "`n[TC6] Kiểm tra: Chặn hủy booking đã hoàn thành" -ForegroundColor Yellow
try {
    $tc6Body = @{ cancellationReason = "Bận việc đột xuất" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/bookings/$($booking1.id)/cancel" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $cust1Token" } -Body $tc6Body
    Write-Host "[FAIL] TC6: Hệ thống cho phép hủy đơn đã Completed!" -ForegroundColor Red
    $failedCount++
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) {
        Write-Host "[PASS] TC6: Đã chặn thành công với mã 400 Bad Request!" -ForegroundColor Green
        $passedCount++
    } else {
        Write-Host "[FAIL] TC6: Mong đợi 400 nhưng nhận mã: $code" -ForegroundColor Red
        $failedCount++
    }
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
if ($passedCount -eq 6) {
    Write-Host "🎉 HOÀN TẤT: TOÀN BỘ 6/6 TEST CASES ĐỀU ĐẠT CHUẨN (PASS)!" -ForegroundColor Green
} else {
    Write-Host "⚠️ KẾT QUẢ: $passedCount/6 TEST CASES ĐẠT (Có $failedCount test case bị THẤT BẠI/FAIL)!" -ForegroundColor Red
    exit 1
}
Write-Host "=======================================================" -ForegroundColor Cyan
