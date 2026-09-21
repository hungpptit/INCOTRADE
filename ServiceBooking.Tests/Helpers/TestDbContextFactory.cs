using Microsoft.EntityFrameworkCore;
using ServiceBooking.Api.Data;

namespace ServiceBooking.Tests.Helpers;

public static class TestDbContextFactory
{
    public static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"ServiceBookingTestDb_{Guid.NewGuid()}")
            .Options;

        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}
