using DeviceManagement.API.Constants;
using DeviceManagement.API.DTOs;
using DeviceManagement.API.Interfaces;
using DeviceManagement.API.Models;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using DeviceManagement.API.Services;

namespace DeviceManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevicesController : ControllerBase
{
    private readonly IDeviceRepository _repo;
    public DevicesController(IDeviceRepository repo) => _repo = repo;

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll() =>
        Ok(await _repo.GetAllAsync());

    [HttpGet("search")]
    [Authorize]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(await _repo.GetAllAsync());
        return Ok(await _repo.SearchAsync(q));
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var device = await _repo.GetByIdAsync(id);
        return device is null ? NotFound() : Ok(device);
    }

    [HttpPost("generate-description")]
    [Authorize]
    public async Task<IActionResult> GenerateDescription(
        [FromBody] GenerateDescriptionDto dto,
        [FromServices] AiService aiService)
    {
        try
        {
            var description = await aiService.GenerateDescriptionAsync(dto);
            return Ok(new { description });
        }
        catch (HttpRequestException ex) { return StatusCode(502, new { message = ex.Message }); }
        catch (Exception ex)            { return StatusCode(500, new { message = ex.Message }); }
    }

    [HttpPost]
    [Authorize(Roles = Roles.ManagerOrAdmin)]
    public async Task<IActionResult> Create([FromBody] CreateDeviceDto dto)
    {
        if (await _repo.ExistsAsync(dto.Name))
            return Conflict(new { message = $"A device named '{dto.Name}' already exists." });

        var device = new Device
        {
            Name         = dto.Name,
            Manufacturer = dto.Manufacturer,
            Type         = dto.NormalizedType,   // normalisation from DTO property
            OS           = dto.OS,
            OSVersion    = dto.OSVersion,
            Processor    = dto.Processor,
            RAM          = dto.RAM,
            Description  = dto.Description
        };

        var created = await _repo.CreateAsync(device);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = Roles.ManagerOrAdmin)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDeviceDto dto)
    {
        if (await _repo.ExistsAsync(dto.Name, excludeId: id))
            return Conflict(new { message = $"Another device named '{dto.Name}' already exists." });

        var updated = new Device
        {
            Name         = dto.Name,
            Manufacturer = dto.Manufacturer,
            Type         = dto.NormalizedType,
            OS           = dto.OS,
            OSVersion    = dto.OSVersion,
            Processor    = dto.Processor,
            RAM          = dto.RAM,
            Description  = dto.Description
        };

        var result = await _repo.UpdateAsync(id, updated);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _repo.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id}/assign")]
    [Authorize]
    public async Task<IActionResult> Assign(int id)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
            return Unauthorized(new { message = "Invalid user token." });

        var device = await _repo.GetByIdAsync(id);
        if (device is null) return NotFound();
        if (device.AssignedUserId is not null)
            return Conflict(new { message = "Device is already assigned to someone." });

        var result = await _repo.AssignAsync(id, userId);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id}/unassign")]
    [Authorize]
    public async Task<IActionResult> Unassign(int id)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
            return Unauthorized(new { message = "Invalid user token." });

        var role   = User.FindFirstValue(ClaimTypes.Role);
        var device = await _repo.GetByIdAsync(id);
        if (device is null) return NotFound();

        if (role == Roles.Employee && device.AssignedUserId != userId)
            return Forbid();

        var result = await _repo.UnassignAsync(id);
        return result is null ? NotFound() : Ok(result);
    }
    // NormalizeType removed — it now lives as a property on CreateDeviceDto/UpdateDeviceDto
}