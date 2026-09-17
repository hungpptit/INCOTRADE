# SERVICE BOOKING MANAGEMENT SYSTEM (HỆ THỐNG QUẢN LÝ ĐẶT LỊCH DỊCH VỤ)

Dự án Full-stack Demo phục vụ kiểm tra năng lực Full-stack Intern theo tài liệu yêu cầu **Service Booking Demo Project Requirements**.

---

## 1. Công nghệ sử dụng (Tech Stack)

* **Backend**: ASP.NET Core Web API (.NET 7), Entity Framework Core 7 (Code-First).
* **Frontend**: Next.js 14+ (App Router), TypeScript, CSS.
* **Database**: PostgreSQL 16 (chạy trên Docker container).
* **Quản trị Database**: `pgweb` Web UI (cổng `8081`).
* **Authentication**: JWT Bearer Token (Phân quyền `Admin` và `Customer`).
* **Mã hóa mật khẩu**: BCrypt (`BCrypt.Net-Next`).

---

## 2. Thông tin tài khoản Demo (Seed Data)

Hệ thống đã cấu hình tự động nạp dữ liệu mẫu hợp lệ, **tính động theo thời gian thực kể từ ngày khởi chạy ứng dụng** (7 ngày làm việc tiếp theo và 10 đơn đặt lịch mẫu với đủ các trạng thái).

### Danh sách tài khoản đăng nhập:
> **Mật khẩu chung cho tất cả tài khoản:** `Demo@123456`

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Admin (Quản trị viên)** | `admin@booking.com` | `Demo@123456` | Quản trị dịch vụ, ca làm việc nhân viên, duyệt/hủy toàn bộ lịch hẹn |
| **Customer 1 (Khách hàng)** | `customer1@gmail.com` | `Demo@123456` | Đặt lịch dịch vụ, xem khung giờ trống, xem/hủy lịch cá nhân |
| **Customer 2 (Khách hàng)** | `customer2@gmail.com` | `Demo@123456` | Kiểm thử đa khách hàng và kiểm tra chống trùng lịch |

---

## 3. Yêu cầu môi trường trước khi chạy (Prerequisites)

* [.NET SDK 7.0](https://dotnet.microsoft.com/download/dotnet/7.0) (hoặc mới hơn)
* [Node.js v18+](https://nodejs.org/) và npm
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (đang bật)

---

## 4. Hướng dẫn cài đặt và khởi chạy (Quick Start)

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

## 5. Migration & SQL Script (Cơ sở dữ liệu)

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

## 6. Cấu trúc thư mục dự án

```
INCOTRADE/
├── ServiceBooking.Api/          # Backend ASP.NET Core Web API
│   ├── Common/                  # Constants (UserRoles, BookingStatus)
│   ├── Controllers/             # API Endpoints
│   ├── Data/                    # AppDbContext, DbInitializer (Seed Data)
│   ├── Migrations/              # EF Core Code-First Migrations
│   ├── Models/                  # 5 Entities (User, Service, Staff, WorkSchedule, Booking)
│   └── appsettings.Development.json
├── frontend/                    # Frontend Next.js App Router & TypeScript
│   └── src/app/                 # Các màn hình theo route yêu cầu
├── docs/                        # Tài liệu đặc tả nghiệp vụ & database schema
├── docker-compose.yml           # Cấu hình container PostgreSQL 16 & pgweb
├── database_init.sql            # Script SQL tạo toàn bộ bảng & constraints
└── README.md                    # Tài liệu hướng dẫn cài đặt và chạy
```

---

## 7. Các quy tắc nghiệp vụ cốt lõi đã hiện thực

1. **Tính thời gian kết thúc**: $\text{EndTime} = \text{StartTime} + \text{DurationMinutes}$.
2. **Chống trùng lịch (Conflict Check)**:
   $$\text{NewStart} < \text{ExistingEnd} \quad \text{AND} \quad \text{NewEnd} > \text{ExistingStart}$$
   API trả về mã **`HTTP 409 Conflict`** khi phát hiện trùng lịch của nhân viên.
3. **Quy tắc hủy lịch**: Khi hủy bắt buộc phải nhập lý do (`CancellationReason`), giải phóng khung giờ, không được hủy lịch đã diễn ra hoặc đã hoàn thành.

---

## 8. Hướng dẫn chạy kiểm thử tự động (Automated Test Cases)

Hệ thống cung cấp script PowerShell tự động kiểm thử toàn bộ các kịch bản nghiệp vụ bắt buộc (từ TC1 đến TC6 theo yêu cầu đề bài):
* **TC1**: Chặn đặt lịch trong quá khứ (`StartTime > DateTime.UtcNow`).
* **TC2**: Chặn đặt lịch ngoài giờ làm việc của nhân viên.
* **TC3**: Chặn hai đơn trùng khung giờ cùng một nhân viên (`HTTP 409 Conflict`).
* **TC4**: Khách hàng không xem được thông tin đặt lịch của khách hàng khác.
* **TC5**: Khách hàng không có quyền tự chuyển trạng thái hoàn thành dịch vụ (`HTTP 403 Forbidden`).
* **TC6**: Chặn không cho phép hủy lịch hẹn đã hoàn thành.

### Các bước thực hiện:

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
*(Script sẽ tự động đăng nhập các tài khoản mẫu, chuẩn bị dữ liệu kiểm thử và lần lượt kích hoạt các API kịch bản).*

