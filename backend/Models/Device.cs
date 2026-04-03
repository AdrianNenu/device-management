namespace DeviceManagement.API.Models;

public class Device
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "Phone" or "Tablet"
    public string OS { get; set; } = string.Empty;
    public string OSVersion { get; set; } = string.Empty;
    public string Processor { get; set; } = string.Empty;
    public int RAM { get; set; }
    public string? Description { get; set; }
    public int? AssignedUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? AssignedUser { get; set; }
}