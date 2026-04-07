using DeviceManagement.API.Models;

namespace DeviceManagement.API.Interfaces;

public interface IDeviceRepository
{
    Task<IEnumerable<Device>> GetAllAsync();
    Task<Device?> GetByIdAsync(int id);
    Task<Device> CreateAsync(Device device);
    Task<Device?> UpdateAsync(int id, Device device);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(string name, int? excludeId = null);
    Task<Device?> AssignAsync(int deviceId, int userId);
    Task<Device?> UnassignAsync(int deviceId);
}