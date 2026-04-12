using DeviceManagement.API.DTOs;
using DeviceManagement.API.Services;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeviceManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly IAntiforgery _antiforgery;

    public AuthController(AuthService auth, IAntiforgery antiforgery)
    {
        _auth        = auth;
        _antiforgery = antiforgery;
    }

    // Provides the CSRF token to the Angular app on startup.
    // Angular reads the XSRF-TOKEN cookie and sends it back as X-XSRF-TOKEN header.
    [HttpGet("csrf")]
    [IgnoreAntiforgeryToken]
    public IActionResult GetCsrfToken()
    {
        var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
        Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!, new CookieOptions
        {
            HttpOnly = false, // Angular needs to read this one
            Secure   = true,
            SameSite = SameSiteMode.Strict
        });
        return NoContent();
    }

    [HttpPost("register")]
    [IgnoreAntiforgeryToken] // Registration is safe to exempt — no existing session
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Name, email and password are required." });

        var result = await _auth.RegisterAsync(dto);
        if (result is null)
            return Conflict(new { message = "Email already in use." });

        AttachAuthCookie(result.Token);
        return Ok(new { result.Name, result.UserId, result.Role });
    }

    [HttpPost("login")]
    [IgnoreAntiforgeryToken] // Login has no existing session cookie to exploit
    public async Task<IActionResult> Login(LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Email and password are required." });

        var result = await _auth.LoginAsync(dto);
        if (result is null)
            return Unauthorized(new { message = "Invalid email or password." });

        AttachAuthCookie(result.Token);
        return Ok(new { result.Name, result.UserId, result.Role });
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("auth_token");
        return NoContent();
    }

    private void AttachAuthCookie(string token)
    {
        Response.Cookies.Append("auth_token", token, new CookieOptions
        {
            HttpOnly = true,
            Secure   = true,
            SameSite = SameSiteMode.Strict,
            Expires  = DateTimeOffset.UtcNow.AddDays(7)
        });
    }
}