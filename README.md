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

### Bước 2: Khởi chạy Backend Web API

Mở terminal tại thư mục gốc và chạy:

```bash
cd ServiceBooking.Api
dotnet run
```

* Backend sẽ **tự động áp dụng Migration và tự động Seed Data mẫu** vào PostgreSQL ngay lần đầu khởi chạy.
* **Swagger UI API Documentation**: Mở trình duyệt truy cập: **`http://localhost:5129/swagger`** (hoặc port được thông báo trên terminal).

---

### Bước 3: Khởi chạy Frontend (Next.js)

Mở một cửa sổ terminal mới và chạy:

```bash
cd frontend
npm install
npm run dev
```

* Mở trình duyệt truy cập giao diện: **[http://localhost:3000](http://localhost:3000)**

---

## 5. Migration & SQL Script (Cơ sở dữ liệu)

Hệ thống hỗ trợ 2 phương án khởi tạo CSDL:

### Cách 1: Sử dụng EF Core Migration (Khuyên dùng)
Backend đã cấu hình tự động chạy migration khi khởi động. Hoặc bạn có thể chạy thủ công bằng lệnh:
```bash
dotnet ef database update --project ServiceBooking.Api
```

### Cách 2: Sử dụng file SQL Script trực tiếp
Nếu không sử dụng EF Core CLI, bạn có thể chạy trực tiếp file SQL đã được xuất sẵn tại thư mục gốc:
* File script: **`database_init.sql`**
* Cách chạy vào PostgreSQL bằng command line:
  ```bash
  docker exec -i incotrade_postgres psql -U postgres -d booking_db < database_init.sql
  ```
  *(Hoặc mở file `database_init.sql`, copy toàn bộ nội dung và dán vào ô Query của **pgweb** tại `http://localhost:8081` rồi nhấn Run Query).*

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
