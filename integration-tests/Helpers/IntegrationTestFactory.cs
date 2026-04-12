using DeviceManagement.API.Data;
using DeviceManagement.API.Models; // <-- Added to access 'User'
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DeviceManagement.IntegrationTests.Helpers;

public class IntegrationTestFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("IntegrationTest");

        builder.UseSetting("Jwt:Key",      "integration-test-secret-key-minimum-32-chars!");
        builder.UseSetting("Jwt:Issuer",   "DeviceManagement");
        builder.UseSetting("Jwt:Audience", "DeviceManagement");

        builder.ConfigureServices(services =>
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(_connection));
        });
    }

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();
       
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        // Seed the Admin and Manager users directly into the database.
        // This bypasses the API security rule that forces all new registrants to be "Employee".
        if (!db.Users.Any(u => u.Email == "admin.devices@example.com"))
        {
            db.Users.Add(new User
            {
                Name = "Admin User",
                Email = "admin.devices@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Role = "Admin",
                Location = "London"
            });

            db.Users.Add(new User
            {
                Name = "Manager User",
                Email = "manager.devices@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager123!"),
                Role = "Manager",
                Location = "London"
            });

            await db.SaveChangesAsync();
        }
    }

    public new async Task DisposeAsync()
    {
        await _connection.DisposeAsync();
    }
}