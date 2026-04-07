using DeviceManagement.API.DTOs;
using DeviceManagement.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeviceManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    public AuthController(AuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Name, email and password are required." });

        var result = await _auth.RegisterAsync(dto);
        return result is null
            ? Conflict(new { message = "Email already in use." })
            : Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Email and password are required." });

        var result = await _auth.LoginAsync(dto);
        return result is null
            ? Unauthorized(new { message = "Invalid email or password." })
            : Ok(result);
    }
}