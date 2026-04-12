namespace DeviceManagement.API.DTOs;

public record RegisterDto(string Name, string Email, string Password, string Location);
public record LoginDto(string Email, string Password);
public record AuthResponseDto(string Token, string Name, int UserId, string Role);