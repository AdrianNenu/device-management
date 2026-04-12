using System.Net.Http.Json;

namespace DeviceManagement.IntegrationTests.Helpers;

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

        // Login — the JWT is set as an HttpOnly cookie on the response.
        // For integration tests we need to extract it from Set-Cookie manually
        // because HttpClient doesn't expose HttpOnly cookies via JavaScript APIs
        // (which is the whole point), but the test HttpClient can read response headers.
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email, password
        });

        loginResponse.EnsureSuccessStatusCode();

        // Extract the raw token from the Set-Cookie header for test purposes only.
        // In production this cookie is never readable by JavaScript.
        if (loginResponse.Headers.TryGetValues("Set-Cookie", out var cookies))
        {
            foreach (var cookie in cookies)
            {
                if (cookie.StartsWith("auth_token="))
                {
                    var token = cookie.Split(';')[0].Replace("auth_token=", "");
                    return token;
                }
            }
        }

        throw new InvalidOperationException($"auth_token cookie not found in login response for {email}.");
    }

    // Sets the token as a cookie header on the client (mirrors what the browser does).
    // Sets the token as a cookie header on the client (mirrors what the browser does).
    public static void SetBearerToken(this HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Remove("Cookie");

        // 1. Fetch the CSRF token from the backend
        var csrfResponse = client.GetAsync("/api/auth/csrf").GetAwaiter().GetResult();
        csrfResponse.EnsureSuccessStatusCode();

        var cookiesToSet = new List<string> { $"auth_token={token}" };

        // 2. Extract all cookies returned by the CSRF endpoint 
        // (This includes the internal .AspNetCore.Antiforgery cookie AND your custom XSRF-TOKEN cookie)
        if (csrfResponse.Headers.TryGetValues("Set-Cookie", out var responseCookies))
        {
            foreach (var c in responseCookies)
            {
                var cookieStr = c.Split(';')[0];
                cookiesToSet.Add(cookieStr);

                // Extract the value to set as the HTTP Header
                if (cookieStr.StartsWith("XSRF-TOKEN="))
                {
                    var xsrfToken = cookieStr.Substring("XSRF-TOKEN=".Length);
                    client.DefaultRequestHeaders.Remove("X-XSRF-TOKEN");
                    client.DefaultRequestHeaders.Add("X-XSRF-TOKEN", Uri.UnescapeDataString(xsrfToken));
                }
            }
        }

        // 3. Set the combined Cookie header so the next request sends both auth and CSRF cookies
        client.DefaultRequestHeaders.Add("Cookie", string.Join("; ", cookiesToSet));
    }
}