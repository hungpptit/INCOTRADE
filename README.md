# SERVICE BOOKING MANAGEMENT SYSTEM (HỆ THỐNG QUẢN LÝ ĐẶT LỊCH DỊCH VỤ)

Hệ thống quản lý đặt lịch dịch vụ (Service Booking Management System) được xây dựng trên nền tảng .NET 7 Web API, Next.js và PostgreSQL.

---

## 1. Công nghệ sử dụng (Tech Stack)

* **Backend**: ASP.NET Core Web API (.NET 7), Entity Framework Core 7 (Code-First).
* **Frontend**: Next.js 14+ (App Router), TypeScript, CSS.
* **Database**: PostgreSQL 16 (chạy trên Docker container).
* **Quản trị Database**: `pgweb` Web UI (cổng `8081`).
* **Authentication**: JWT Bearer Token (Phân quyền `Admin` và `Customer`).
* **Mã hóa mật khẩu**: BCrypt (`BCrypt.Net-Next`).

---

## 2. Danh sách chức năng theo yêu cầu (Requirements Checklist)

### 2.1. Chức năng đã hoàn thành (Core Requirements - 100%)
* [x] **1. Phân quyền & Vai trò**: Đăng nhập JWT, hỗ trợ 2 vai trò `Customer` và `Admin`.
* [x] **2. Quản lý dịch vụ**: Thêm, sửa, khóa/mở lại dịch vụ; validate giá và thời lượng; tìm kiếm và phân trang tại database; chặn đặt dịch vụ bị khóa.
* [x] **3. Nhân viên & Lịch làm việc**: Quản lý nhân viên; thiết lập ca trực; chống trùng ca làm việc; chặn đặt lịch với nhân viên bị khóa.
* [x] **4. Quản lý booking**: 4 trạng thái bắt buộc (`Pending`, `Confirmed`, `Completed`, `Cancelled`); lọc theo ngày, trạng thái và phân trang; Customer chỉ quản lý lịch của mình, Admin quản lý toàn bộ.
* [x] **5. Quy tắc nghiệp vụ**:
  * Tự động tính $\text{EndTime} = \text{StartTime} + \text{DurationMinutes}$.
  * Chặn đặt trong quá khứ và ngoài giờ làm việc.
  * Thuật toán chống trùng lịch ($\text{NewStart} < \text{ExistingEnd} \text{ và } \text{NewEnd} > \text{ExistingStart}$), trả về `409 Conflict`.
  * Hủy lịch bắt buộc nhập lý do, giải phóng khung giờ, chặn hủy lịch đã diễn ra hoặc đã hoàn thành.
* [x] **6. Màn hình bắt buộc**: Hoàn thành đủ 7 màn hình Next.js App Router (`/login`, `/services`, `/booking`, `/my-bookings`, `/admin/services`, `/admin/schedules`, `/admin/bookings`).
* [x] **7. API tối thiểu**: Hoàn thành toàn bộ API trong đặc tả + tài liệu Swagger UI tại `/swagger`.
* [x] **8. Yêu cầu kỹ thuật**:
  * **Backend**: DTOs riêng biệt, validation, async/await 100%, Global Exception Handling, phân trang tại database.
  * **Frontend**: TypeScript không dùng `any`, đầy đủ trạng thái (loading skeleton, empty state, error 409 alert), chống click đúp form.
  * **Database**: PostgreSQL với khóa chính, khóa ngoại, unique index (`Email`, `BookingCode`), hỗ trợ EF Core Migration & SQL Script.
* [x] **9. Dữ liệu mẫu (Seed Data)**: Đầy đủ 1 Admin, 2 Customer, 2 Nhân viên, 5 Dịch vụ, ca trực động 7 ngày và 10 booking mẫu.
* [x] **10. Kiểm thử**: Đạt toàn bộ 6 test cases bắt buộc (TC1 $\rightarrow$ TC6) trên cả 13 Unit Tests (xUnit) và script kiểm thử tích hợp tự động (`test_all_cases.ps1`).

### 2.2. Chức năng chưa thực hiện (Tính năng nâng cao ngoài phạm vi cốt lõi)
* [ ] Cập nhật trạng thái booking theo thời gian thực (Real-time với SignalR).
* [ ] Background Job tự động quét và hủy booking quá hạn bằng Hangfire.

---

## 3. Thông tin tài khoản Demo (Seed Data)

Hệ thống đã cấu hình tự động nạp dữ liệu mẫu hợp lệ, **tính động theo thời gian thực kể từ ngày khởi chạy ứng dụng** (7 ngày làm việc tiếp theo và 10 đơn đặt lịch mẫu với đủ các trạng thái).

### Danh sách tài khoản đăng nhập:
> **Mật khẩu chung cho tất cả tài khoản:** `Demo@123456`

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Admin (Quản trị viên)** | `admin@booking.com` | `Demo@123456` | Quản trị dịch vụ, ca làm việc nhân viên, duyệt/hủy toàn bộ lịch hẹn |
| **Customer 1 (Khách hàng)** | `customer1@gmail.com` | `Demo@123456` | Đặt lịch dịch vụ, xem khung giờ trống, xem/hủy lịch cá nhân |
| **Customer 2 (Khách hàng)** | `customer2@gmail.com` | `Demo@123456` | Kiểm thử đa khách hàng và kiểm tra chống trùng lịch |

---

## 4. Yêu cầu môi trường trước khi chạy (Prerequisites)

* [.NET SDK 7.0](https://dotnet.microsoft.com/download/dotnet/7.0) (hoặc mới hơn)
* [Node.js v18+](https://nodejs.org/) và npm
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (đang bật)

---

## 5. Hướng dẫn cài đặt và khởi chạy (Quick Start)

### Bước 1: Khởi động Cơ sở dữ liệu (PostgreSQL & pgweb)

Mở terminal tại thư mục gốc dự án (`D:\INCOTRADE`) và chạy:

```bash
docker compose up -d
```

Sau khi khởi động thành công:
* **PostgreSQL Database**: Sẵn sàng tại `localhost:5433` (DB: `booking_db`, User: `postgres`, Pass: `password123`).
* **pgweb GUI**: Truy cập trình duyệt tại **[http://localhost:8081](http://localhost:8081)** để xem trực quan các bảng và dữ liệu.

---

### Bước 2: Khởi chạy Backend Web API (.NET 7)

Backend API phục vụ toàn bộ nghiệp vụ và kết nối với Frontend qua cổng chuẩn **`http://localhost:5000`**.

* **Thư mục làm việc:** Đứng tại thư mục gốc `INCOTRADE`, di chuyển vào thư mục `ServiceBooking.Api`:
  ```bash
  cd ServiceBooking.Api
  ```
* **Lệnh khởi chạy:**
  ```bash
  dotnet run --urls="http://localhost:5000"
  ```
  *(Hoặc đứng tại thư mục gốc `INCOTRADE` và chạy: `dotnet run --project ServiceBooking.Api --urls="http://localhost:5000"`)*

> [!NOTE]
> * **Tự động cấu hình CSDL:** Ngay khi khởi chạy, Backend đã tích hợp sẵn cơ chế **tự động áp dụng Migration và tự động nạp Seed Data mẫu** vào PostgreSQL (tự tính lịch 7 ngày tới và các đơn mẫu). Bạn **không bắt buộc** phải chạy lệnh migration thủ công.
> * **Swagger UI API Documentation:** Truy cập trực tiếp tại: **[http://localhost:5000/swagger](http://localhost:5000/swagger)**.

---

### Bước 3: Khởi chạy Frontend (Next.js App Router)

Frontend giao diện người dùng và quản trị viên chạy trên cổng **`http://localhost:3000`** và tự động kết nối với Backend API tại cổng `http://localhost:5000`.

* **Thư mục làm việc:** Mở một cửa sổ terminal mới, đứng tại thư mục gốc `INCOTRADE` và di chuyển vào thư mục `frontend`:
  ```bash
  cd frontend
  ```

* **Cài đặt thư viện dependencies (chỉ cần chạy lần đầu):**
  ```bash
  npm install
  ```

* **Lựa chọn 1 trong 2 chế độ chạy:**
  * **Cách A - Chế độ Phát triển (Development - Hot Reload):**
    ```bash
    npm run dev
    ```
    Phù hợp khi cần vừa xem vừa chỉnh sửa code.
  * **Cách B - Chế độ Production (Đã build tối ưu, tải trang siêu tốc):**
    ```bash
    npm run build
    npm run start
    ```
    *(Hoặc: `npx next start -p 3000`)*

* **Truy cập ứng dụng:** Mở trình duyệt tại **[http://localhost:3000](http://localhost:3000)**.
  - Khách hàng đăng nhập: `/login` $\rightarrow$ Đặt lịch: `/booking` $\rightarrow$ Lịch cá nhân: `/my-bookings`.
  - Quản trị viên đăng nhập: `/login` (tài khoản Admin) $\rightarrow$ Quản trị lịch hẹn: `/admin/bookings` $\rightarrow$ Quản lý ca trực: `/admin/schedules` $\rightarrow$ Dịch vụ: `/admin/services`.

---

## 6. Migration & SQL Script (Cơ sở dữ liệu)

> [!TIP]
> **Khuyên dùng:** Backend đã được lập trình để **tự động chạy Migration và Seed Data** mỗi khi khởi động `dotnet run`. Nếu bạn muốn chủ động tạo lại CSDL từ đầu hoặc chạy thủ công, hãy chọn 1 trong 2 cách dưới đây.

### Cách 1: Sử dụng EF Core Migration CLI

Tùy thuộc vào thư mục bạn đang mở trong Terminal, hãy chạy lệnh tương ứng:

* **Trường hợp 1: Nếu Terminal đang đứng tại thư mục gốc dự án (`INCOTRADE/`):**
  ```bash
  # Đứng tại: d:\INCOTRADE
  dotnet ef database update --project ServiceBooking.Api
  ```

* **Trường hợp 2: Nếu Terminal đang đứng bên trong thư mục `ServiceBooking.Api/`:**
  ```bash
  # Đứng tại: d:\INCOTRADE\ServiceBooking.Api
  dotnet ef database update
  ```

*(Yêu cầu máy đã cài công cụ EF CLI: `dotnet tool install --global dotnet-ef`)*

---

### Cách 2: Sử dụng file SQL Script trực tiếp (`database_init.sql`)

Nếu máy không cài đặt `dotnet-ef` hoặc bạn muốn chạy trực tiếp bằng câu lệnh SQL thuần vào container PostgreSQL:

* **File script:** File `database_init.sql` nằm ngay tại **thư mục gốc của dự án (`INCOTRADE/database_init.sql`)**.
* **Thực thi qua Docker CLI:** Đứng tại **thư mục gốc dự án (`INCOTRADE/`)** và chạy:
  ```bash
  # Đứng tại thư mục gốc: d:\INCOTRADE
  docker exec -i incotrade_postgres psql -U postgres -d booking_db < database_init.sql
  ```
* **Hoặc thực thi qua giao diện web `pgweb` (Cực kỳ đơn giản):**
  1. Mở trình duyệt truy cập: **[http://localhost:8081](http://localhost:8081)**.
  2. Mở file `database_init.sql` bằng VS Code / Notepad, copy toàn bộ nội dung.
  3. Dán vào khung **SQL Query** của pgweb và bấm **Execute / Run Query**.

---

## 7. Cấu trúc thư mục dự án

```
INCOTRADE/
├── ServiceBooking.sln           # Visual Studio / .NET Solution liên kết các dự án
├── ServiceBooking.Api/          # Backend ASP.NET Core Web API (.NET 7)
│   ├── Common/                  # Constants (UserRoles, BookingStatus)
│   ├── Controllers/             # API Endpoints
│   ├── Data/                    # AppDbContext, DbInitializer (Seed Data)
│   ├── Migrations/              # EF Core Code-First Migrations
│   ├── Models/                  # 5 Entities (User, Service, Staff, WorkSchedule, Booking)
│   └── appsettings.Development.json
├── ServiceBooking.Tests/        # Bộ kiểm thử đơn vị xUnit (Unit Tests)
│   ├── Helpers/                 # TestDbContextFactory (EF Core InMemory)
│   └── Services/                # BookingServiceTests (13 Unit Tests kiểm thử TC1 -> TC6)
├── frontend/                    # Frontend Next.js App Router & TypeScript
│   └── src/app/                 # Các màn hình theo route yêu cầu
├── docs/                        # Tài liệu đặc tả nghiệp vụ & database schema
├── docker-compose.yml           # Cấu hình container PostgreSQL 16 & pgweb
├── database_init.sql            # Script SQL tạo toàn bộ bảng & constraints
├── test_all_cases.ps1           # Script kiểm thử tích hợp tự động (Integration Test)
└── README.md                    # Tài liệu hướng dẫn cài đặt và chạy
```

---

## 8. Các quy tắc nghiệp vụ cốt lõi đã hiện thực

1. **Tính thời gian kết thúc**: $\text{EndTime} = \text{StartTime} + \text{DurationMinutes}$.
2. **Chống trùng lịch (Conflict Check)**:
   $$\text{NewStart} < \text{ExistingEnd} \quad \text{AND} \quad \text{NewEnd} > \text{ExistingStart}$$
   API trả về mã **`HTTP 409 Conflict`** khi phát hiện trùng lịch của nhân viên.
3. **Quy tắc hủy lịch**: Khi hủy bắt buộc phải nhập lý do (`CancellationReason`), giải phóng khung giờ, không được hủy lịch đã diễn ra hoặc đã hoàn thành.

---

## 9. Hướng dẫn chạy kiểm thử (Testing)

Dự án hiện thực đầy đủ cả 2 cấp độ kiểm thử:
1. **Unit Test (xUnit)**: Kiểm thử cô lập toàn bộ logic nghiệp vụ (không cần bật CSDL).
2. **Integration Test (PowerShell E2E API)**: Kiểm thử tích hợp toàn diện trên CSDL thực tế.

---

### 9.1. Chạy Unit Test (xUnit - Lệnh chuẩn `dotnet test`)

Mở một cửa sổ Terminal tại thư mục gốc dự án (`INCOTRADE`) và chạy:

```bash
dotnet test
```

> **Kết quả:** Toàn bộ **13/13 Unit Tests** đều **PASSED** chỉ trong ~0.15 giây:
> * Kiểm tra tính toán `EndTime = StartTime + DurationMinutes`.
> * **[TC1]** Chặn đặt lịch trong quá khứ $\rightarrow$ Ném `BadRequestException`.
> * Chặn đặt lịch vượt quá giới hạn 7 ngày mở lịch $\rightarrow$ Ném `BadRequestException`.
> * **[TC2]** Chặn đặt lịch ngoài ca làm việc của nhân viên $\rightarrow$ Ném `BadRequestException`.
> * **[TC3]** Chặn hai booking trùng khung giờ $\rightarrow$ Ném `ConflictException (409)`.
> * Chặn hai booking giao khoảng giờ (Overlap) $\rightarrow$ Ném `ConflictException (409)`.
> * Cho phép hai booking liền kề nhau (Adjacent Back-to-Back).
> * **[TC4]** Khách hàng không xem được booking của khách hàng khác $\rightarrow$ Ném `NotFoundException (404)`.
> * Quản trị viên (Admin) xem được booking của mọi khách hàng.
> * **[TC5]** Chặn chuyển trạng thái trực tiếp từ Pending sang Completed mà chưa qua Confirmed $\rightarrow$ Ném `BadRequestException`.
> * **[TC6]** Chặn không cho phép hủy lịch hẹn đã Completed $\rightarrow$ Ném `BadRequestException`.
> * Chặn không cho phép hủy lịch hẹn đã bắt đầu trong quá khứ $\rightarrow$ Ném `BadRequestException`.
> * Cho phép hủy lịch hẹn hợp lệ và lưu lại lý do hủy (`CancellationReason`).

---

### 9.2. Chạy Integration Test tự động (6 Test Cases TC1 -> TC6)

Hệ thống cung cấp script PowerShell tự động kiểm thử toàn bộ các kịch bản nghiệp vụ chính (từ TC1 đến TC6 trên CSDL thực tế):

#### Bước 1: Khởi động Backend API
Mở cửa sổ Terminal tại thư mục dự án và chạy Backend API lắng nghe tại cổng `http://localhost:5000`:
```bash
cd ServiceBooking.Api
dotnet run --urls="http://localhost:5000"
```

#### Bước 2: Chạy Script kiểm thử tự động
Mở một cửa sổ Terminal khác (PowerShell) tại thư mục gốc dự án (`INCOTRADE`) và thực thi lệnh:
```powershell
powershell -ExecutionPolicy Bypass -File .\test_all_cases.ps1
```
*(Script sẽ tự động đăng nhập các tài khoản mẫu, chuẩn bị ca làm việc, tự tìm slot trống và lần lượt kiểm tra nghiêm ngặt từng mã HTTP status).*

