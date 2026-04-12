using System.Linq.Expressions;
using DeviceManagement.API.Data;
using DeviceManagement.API.DTOs;
using DeviceManagement.API.Interfaces;
using DeviceManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DeviceManagement.API.Repositories;

public class DeviceRepository : IDeviceRepository
{
    private readonly AppDbContext _db;
    public DeviceRepository(AppDbContext db) => _db = db;

    // EF-translatable expression — projects in SQL, no client-side evaluation
    private static readonly Expression<Func<Device, DeviceDto>> AsDto = d => new DeviceDto(
        d.Id, d.Name, d.Manufacturer, d.Type,
        d.OS, d.OSVersion, d.Processor, d.RAM,
        d.Description, d.AssignedUserId,
        d.AssignedUser != null ? d.AssignedUser.Name : null
    );

    // For use after SaveChanges on a tracked entity (can't use expressions on in-memory objects)
    private static DeviceDto ToDto(Device d) => new(
        d.Id, d.Name, d.Manufacturer, d.Type,
        d.OS, d.OSVersion, d.Processor, d.RAM,
        d.Description, d.AssignedUserId, d.AssignedUser?.Name
    );

    public async Task<IEnumerable<DeviceDto>> GetAllAsync() =>
        await _db.Devices.Select(AsDto).ToListAsync();

    public async Task<DeviceDto?> GetByIdAsync(int id) =>
        await _db.Devices.Where(d => d.Id == id).Select(AsDto).FirstOrDefaultAsync();

    public async Task<DeviceDto> CreateAsync(Device device)
    {
        _db.Devices.Add(device);
        await _db.SaveChangesAsync();
        await _db.Entry(device).Reference(d => d.AssignedUser).LoadAsync();
        return ToDto(device);
    }

    public async Task<DeviceDto?> UpdateAsync(int id, Device updated)
    {
        var device = await _db.Devices.FindAsync(id);
        if (device is null) return null;

        device.Name         = updated.Name;
        device.Manufacturer = updated.Manufacturer;
        device.Type         = updated.Type;
        device.OS           = updated.OS;
        device.OSVersion    = updated.OSVersion;
        device.Processor    = updated.Processor;
        device.RAM          = updated.RAM;
        device.Description  = updated.Description;

        await _db.SaveChangesAsync();
        await _db.Entry(device).Reference(d => d.AssignedUser).LoadAsync();
        return ToDto(device);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var device = await _db.Devices.FindAsync(id);
        if (device is null) return false;
        _db.Devices.Remove(device);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(string name, int? excludeId = null) =>
        await _db.Devices.AnyAsync(d =>
            d.Name == name && (excludeId == null || d.Id != excludeId.Value));

    public async Task<DeviceDto?> AssignAsync(int deviceId, int userId)
    {
        var device = await _db.Devices.FindAsync(deviceId);
        if (device is null) return null;
        device.AssignedUserId = userId;
        await _db.SaveChangesAsync();
        await _db.Entry(device).Reference(d => d.AssignedUser).LoadAsync();
        return ToDto(device);
    }

    public async Task<DeviceDto?> UnassignAsync(int deviceId)
    {
        var device = await _db.Devices.FindAsync(deviceId);
        if (device is null) return null;
        device.AssignedUserId = null;
        device.AssignedUser   = null;
        await _db.SaveChangesAsync();
        return ToDto(device);
    }

    /// <summary>
    /// Full-text search delegated entirely to SQL via EF.Functions.Like.
    /// No records are loaded into application memory — filtering happens in the database.
    /// Scoring is approximated by ordering: name matches first, then manufacturer, then processor.
    /// </summary>
    public async Task<IEnumerable<DeviceDto>> SearchAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query)) return [];

        // Normalise: strip non-alphanumeric, lowercase, split to tokens
        var clean  = new string(query.Where(c => char.IsLetterOrDigit(c) || char.IsWhiteSpace(c)).ToArray());
        var tokens = clean.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (tokens.Length == 0) return [];

        // Build an IQueryable that only hits the DB once.
        // Each token is OR-ed together per field using EF.Functions.Like.
        IQueryable<Device> q = _db.Devices;

        foreach (var token in tokens)
        {
            var pattern = $"%{token}%";
            q = q.Where(d =>
                EF.Functions.Like(d.Name.ToLower(),         pattern) ||
                EF.Functions.Like(d.Manufacturer.ToLower(), pattern) ||
                EF.Functions.Like(d.Processor.ToLower(),    pattern) ||
                EF.Functions.Like(d.RAM.ToString(),         pattern));
        }

        // Relevance ordering in SQL: name match sorts before manufacturer, etc.
        // CASE WHEN expressions translate to SQL CASE and run on the DB engine.
        var ram = tokens.FirstOrDefault(t => int.TryParse(t, out _));

        return await q
            .OrderBy(d =>
                EF.Functions.Like(d.Name.ToLower(), $"%{tokens[0]}%") ? 0 :
                EF.Functions.Like(d.Manufacturer.ToLower(), $"%{tokens[0]}%") ? 1 :
                EF.Functions.Like(d.Processor.ToLower(), $"%{tokens[0]}%") ? 2 : 3)
            .ThenBy(d => d.Name)
            .Select(AsDto)
            .ToListAsync();
    }
}