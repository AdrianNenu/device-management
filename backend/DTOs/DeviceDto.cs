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
    string Name,
    string Manufacturer,
    string Type,
    string OS,
    string OSVersion,
    string Processor,
    int RAM,
    string? Description
);

public record UpdateDeviceDto(
    string Name,
    string Manufacturer,
    string Type,
    string OS,
    string OSVersion,
    string Processor,
    int RAM,
    string? Description
);