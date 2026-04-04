using DeviceManagement.API.DTOs;
using DeviceManagement.API.Interfaces;
using DeviceManagement.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace DeviceManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevicesController : ControllerBase
{
    private readonly IDeviceRepository _repo;
    public DevicesController(IDeviceRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var devices = await _repo.GetAllAsync();
        return Ok(devices.Select(d => ToDto(d)));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var device = await _repo.GetByIdAsync(id);
        return device is null ? NotFound() : Ok(ToDto(device));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateDeviceDto dto)
    {
        if (await _repo.ExistsAsync(dto.Name))
            return Conflict(new { message = $"A device named '{dto.Name}' already exists." });

        var device = new Device
        {
            Name         = dto.Name,
            Manufacturer = dto.Manufacturer,
            Type         = NormalizeType(dto.Type),
            OS           = dto.OS,
            OSVersion    = dto.OSVersion,
            Processor    = dto.Processor,
            RAM          = dto.RAM,
            Description  = dto.Description
        };

        var created = await _repo.CreateAsync(device);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToDto(created));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateDeviceDto dto)
    {
        if (await _repo.ExistsAsync(dto.Name, excludeId: id))
            return Conflict(new { message = $"Another device named '{dto.Name}' already exists." });

        var updated = new Device
        {
            Name         = dto.Name,
            Manufacturer = dto.Manufacturer,
            Type         = NormalizeType(dto.Type),
            OS           = dto.OS,
            OSVersion    = dto.OSVersion,
            Processor    = dto.Processor,
            RAM          = dto.RAM,
            Description  = dto.Description
        };

        var result = await _repo.UpdateAsync(id, updated);
        return result is null ? NotFound() : Ok(ToDto(result));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _repo.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    private static string NormalizeType(string type) =>
        string.IsNullOrWhiteSpace(type) ? type : char.ToUpper(type[0]) + type[1..].ToLower();

    private static DeviceDto ToDto(Device d) => new(
        d.Id, d.Name, d.Manufacturer, d.Type,
        d.OS, d.OSVersion, d.Processor, d.RAM,
        d.Description, d.AssignedUserId, d.AssignedUser?.Name
    );
}