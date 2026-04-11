using System.ComponentModel.DataAnnotations;

namespace DeviceManagement.API.DTOs;

public record DeviceDto(
    int Id,
    string Name,
    string Manufacturer,
    string Type,
    string OS,
    string OSVersion,
    string Processor,
    int RAM,
    string? Description,
    int? AssignedUserId,
    string? AssignedUserName
);

public record CreateDeviceDto(
    [Required] string Name,
    [Required] string Manufacturer,
    [Required, RegularExpression("(?i)^(Phone|Tablet)$", ErrorMessage = "Type must be either 'Phone' or 'Tablet'.")] string Type,
    [Required] string OS,
    [Required] string OSVersion,
    [Required] string Processor,
    [Range(1, 128, ErrorMessage = "RAM must be between 1 and 128 GB.")] int RAM,
    string? Description
);

public record UpdateDeviceDto(
    [Required] string Name,
    [Required] string Manufacturer,
    [Required, RegularExpression("(?i)^(Phone|Tablet)$", ErrorMessage = "Type must be either 'Phone' or 'Tablet'.")] string Type,
    [Required] string OS,
    [Required] string OSVersion,
    [Required] string Processor,
    [Range(1, 128, ErrorMessage = "RAM must be between 1 and 128 GB.")] int RAM,
    string? Description
);