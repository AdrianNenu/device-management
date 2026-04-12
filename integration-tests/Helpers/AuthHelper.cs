using System.Net.Http.Json;

namespace DeviceManagement.IntegrationTests.Helpers;

/// <summary>
/// Convenience methods for registering and logging in test users,
/// and attaching JWT tokens to HttpClient instances.
/// </summary>
public static class AuthHelper
{
    public static async Task<string> RegisterAndLoginAsync(
        HttpClient client,
        string name     = "Test User",
        string email    = "test@example.com",
        string password = "Password123!",
        string role     = "Employee",
        string location = "London")
    {
        await client.PostAsJsonAsync("/api/auth/register", new
        {
            name, email, password, role, location
        });

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email, password
        });

        var body = await loginResponse.Content.ReadFromJsonAsync<AuthResponseBody>()
            ?? throw new InvalidOperationException("Login failed during test setup.");

        return body.Token;
    }

    public static void SetBearerToken(this HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    private record AuthResponseBody(string Token, string Name, int UserId, string Role);
}