using DeviceManagement.API.Data;
using DeviceManagement.API.Interfaces;
using DeviceManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DeviceManagement.API.Repositories;

public class DeviceRepository : IDeviceRepository
{
    private readonly AppDbContext _db;
    public DeviceRepository(AppDbContext db) => _db = db;

    public async Task<IEnumerable<Device>> GetAllAsync() =>
        await _db.Devices.Include(d => d.AssignedUser).ToListAsync();

    public async Task<Device?> GetByIdAsync(int id) =>
        await _db.Devices.Include(d => d.AssignedUser).FirstOrDefaultAsync(d => d.Id == id);

    public async Task<Device> CreateAsync(Device device)
    {
        _db.Devices.Add(device);
        await _db.SaveChangesAsync();
        return device;
    }

    public async Task<Device?> UpdateAsync(int id, Device updated)
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
        return device;
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

    public async Task<Device?> AssignAsync(int deviceId, int userId)
    {
        var device = await _db.Devices.FindAsync(deviceId);
        if (device is null) return null;

        device.AssignedUserId = userId;

        await _db.SaveChangesAsync();
        await _db.Entry(device).Reference(d => d.AssignedUser).LoadAsync();

        return device;
    }

    public async Task<Device?> UnassignAsync(int deviceId)
    {
        var device = await _db.Devices.FindAsync(deviceId);
        if (device is null) return null;

        device.AssignedUserId = null;
        device.AssignedUser   = null;

        await _db.SaveChangesAsync();
        return device;
    }

    public async Task<IEnumerable<Device>> SearchAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query)) return Enumerable.Empty<Device>();

        var normalizedQuery = new string(query.Where(c => char.IsLetterOrDigit(c) || char.IsWhiteSpace(c)).ToArray());
        var tokens = normalizedQuery.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);

        var devices = await GetAllAsync();

        return devices
            .Select(d =>
            {
                int score = 0;
                string name  = d.Name.ToLower();
                string mfg   = d.Manufacturer.ToLower();
                string proc  = d.Processor.ToLower();
                string ram   = d.RAM.ToString();

                foreach (var token in tokens)
                {
                    if (name.Contains(token)) score += 10;
                    if (mfg.Contains(token))  score += 5;
                    if (proc.Contains(token)) score += 3;
                    if (ram == token)         score += 1;
                }

                return new { Device = d, Score = score };
            })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.Device.Name)
            .Select(x => x.Device);
    }
}