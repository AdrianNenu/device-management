using DeviceManagement.API.Data;
using Microsoft.EntityFrameworkCore;

namespace DeviceManagement.Tests.Helpers;

public static class TestDbFactory
{
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }
}