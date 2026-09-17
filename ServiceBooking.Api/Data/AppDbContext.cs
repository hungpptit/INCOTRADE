using Microsoft.EntityFrameworkCore;
using ServiceBooking.Api.Models;

namespace ServiceBooking.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Staff> Staffs => Set<Staff>();
    public DbSet<WorkSchedule> WorkSchedules => Set<WorkSchedule>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ==========================================
        // 1. USER CONFIGURATION
        // ==========================================
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);

            entity.Property(u => u.FullName)
                .IsRequired()
                .HasMaxLength(150);

            entity.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(256);

            entity.HasIndex(u => u.Email)
                .IsUnique();

            entity.Property(u => u.PasswordHash)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(u => u.Role)
                .IsRequired()
                .HasMaxLength(50);
        });

        // ==========================================
        // 2. SERVICE CONFIGURATION
        // ==========================================
        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(s => s.Id);

            entity.Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(s => s.Description)
                .HasMaxLength(1000);

            entity.Property(s => s.DurationMinutes)
                .IsRequired();

            entity.Property(s => s.Price)
                .IsRequired()
                .HasPrecision(18, 2);

            entity.Property(s => s.IsActive)
                .IsRequired();

            // Check constraints: DurationMinutes > 0 and Price >= 0
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_Services_DurationMinutes", "\"DurationMinutes\" > 0");
                t.HasCheckConstraint("CK_Services_Price", "\"Price\" >= 0");
            });

            entity.HasIndex(s => s.IsActive);
            entity.HasIndex(s => s.Name);
        });

        // ==========================================
        // 3. STAFF CONFIGURATION
        // ==========================================
        modelBuilder.Entity<Staff>(entity =>
        {
            entity.HasKey(st => st.Id);

            entity.Property(st => st.FullName)
                .IsRequired()
                .HasMaxLength(150);

            entity.Property(st => st.Email)
                .IsRequired()
                .HasMaxLength(256);

            entity.HasIndex(st => st.Email)
                .IsUnique();

            entity.Property(st => st.IsActive)
                .IsRequired();

            entity.HasIndex(st => st.IsActive);
        });

        // ==========================================
        // 4. WORK SCHEDULE CONFIGURATION
        // ==========================================
        modelBuilder.Entity<WorkSchedule>(entity =>
        {
            entity.HasKey(ws => ws.Id);

            entity.Property(ws => ws.WorkDate)
                .IsRequired();

            entity.Property(ws => ws.StartTime)
                .IsRequired();

            entity.Property(ws => ws.EndTime)
                .IsRequired();

            // Check constraint: StartTime < EndTime
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_WorkSchedules_Time", "\"StartTime\" < \"EndTime\"");
            });

            // Foreign key to Staff
            entity.HasOne(ws => ws.Staff)
                .WithMany(st => st.WorkSchedules)
                .HasForeignKey(ws => ws.StaffId)
                .OnDelete(DeleteBehavior.Cascade);

            // Index on StaffId and WorkDate
            entity.HasIndex(ws => new { ws.StaffId, ws.WorkDate });
        });

        // ==========================================
        // 5. BOOKING CONFIGURATION
        // ==========================================
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(b => b.Id);

            entity.Property(b => b.BookingCode)
                .IsRequired()
                .HasMaxLength(30);

            entity.HasIndex(b => b.BookingCode)
                .IsUnique();

            entity.Property(b => b.StartTime)
                .IsRequired();

            entity.Property(b => b.EndTime)
                .IsRequired();

            entity.Property(b => b.Status)
                .IsRequired()
                .HasMaxLength(30);

            entity.Property(b => b.CustomerNote)
                .HasMaxLength(500);

            entity.Property(b => b.CancellationReason)
                .HasMaxLength(500);

            entity.Property(b => b.CreatedAt)
                .IsRequired();

            // Check constraint: Status must be one of the required values
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_Bookings_Status",
                    "\"Status\" IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')");
            });

            // Foreign key to Customer (User)
            entity.HasOne(b => b.Customer)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Foreign key to Service
            entity.HasOne(b => b.Service)
                .WithMany(s => s.Bookings)
                .HasForeignKey(b => b.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            // Foreign key to Staff
            entity.HasOne(b => b.Staff)
                .WithMany(st => st.Bookings)
                .HasForeignKey(b => b.StaffId)
                .OnDelete(DeleteBehavior.Restrict);

            // Critical index for conflict overlap checking
            entity.HasIndex(b => new { b.StaffId, b.StartTime, b.EndTime, b.Status });

            // Index for customer's booking list
            entity.HasIndex(b => new { b.CustomerId, b.CreatedAt });

            // Index for admin filtering by date & status
            entity.HasIndex(b => new { b.StartTime, b.Status });
        });
    }
}
