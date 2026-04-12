using DeviceManagement.API.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DeviceManagement.IntegrationTests.Helpers;

public class IntegrationTestFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    // Keep the connection open for the factory lifetime so SQLite doesn't
    // destroy the in-memory database between requests within a single test.
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Setting the environment to "IntegrationTest" causes Program.cs to
        // skip the SqlServer AddDbContext call, so there's nothing to conflict with.
        builder.UseEnvironment("IntegrationTest");

        builder.UseSetting("Jwt:Key",      "integration-test-secret-key-minimum-32-chars!");
        builder.UseSetting("Jwt:Issuer",   "DeviceManagement");
        builder.UseSetting("Jwt:Audience", "DeviceManagement");

        builder.ConfigureServices(services =>
        {
            // Register the SQLite-backed DbContext — the only DbContext in the container.
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
    }

    public new async Task DisposeAsync()
    {
        await _connection.DisposeAsync();
    }
}