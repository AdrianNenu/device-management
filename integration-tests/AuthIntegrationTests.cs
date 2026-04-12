using System.Net;
using System.Net.Http.Json;
using DeviceManagement.IntegrationTests.Helpers;

namespace DeviceManagement.IntegrationTests;

/// <summary>
/// Integration tests for POST /api/auth/register and /api/auth/login.
/// These tests hit the real HTTP pipeline, real middleware, real JWT generation,
/// and real database writes — nothing is mocked.
/// </summary>
public class AuthIntegrationTests : IClassFixture<IntegrationTestFactory>
{
    private readonly HttpClient _client;

    public AuthIntegrationTests(IntegrationTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ── Register ────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_ValidData_Returns200WithToken()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            name     = "Alice Smith",
            email    = "alice.register@example.com",
            password = "Password123!",
            role     = "Employee",
            location = "London"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<AuthBody>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrEmpty(body!.Token));
        Assert.Equal("Alice Smith", body.Name);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        var payload = new
        {
            name     = "Bob Jones",
            email    = "duplicate@example.com",
            password = "Password123!",
            role     = "Employee",
            location = "London"
        };

        await _client.PostAsJsonAsync("/api/auth/register", payload);
        var second = await _client.PostAsJsonAsync("/api/auth/register", payload);

        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Register_MissingFields_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            name  = "",
            email = "missing@example.com",
            // password intentionally omitted via empty string
            password = "",
            role     = "Employee",
            location = "London"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Login ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_ValidCredentials_Returns200WithToken()
    {
        await _client.PostAsJsonAsync("/api/auth/register", new
        {
            name     = "Login User",
            email    = "loginuser@example.com",
            password = "Password123!",
            role     = "Employee",
            location = "London"
        });

        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email    = "loginuser@example.com",
            password = "Password123!"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<AuthBody>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrEmpty(body!.Token));
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        await _client.PostAsJsonAsync("/api/auth/register", new
        {
            name     = "Wrong Pass User",
            email    = "wrongpass@example.com",
            password = "CorrectPassword!",
            role     = "Employee",
            location = "London"
        });

        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email    = "wrongpass@example.com",
            password = "WrongPassword!"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_NonExistentEmail_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email    = "nobody@example.com",
            password = "anything"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private record AuthBody(string Token, string Name, int UserId, string Role);
}