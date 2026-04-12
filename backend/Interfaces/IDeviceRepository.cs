using DeviceManagement.API.DTOs;
using DeviceManagement.API.Models;

namespace DeviceManagement.API.Interfaces;

public interface IDeviceRepository
{
    Task<IEnumerable<DeviceDto>> GetAllAsync();
    Task<DeviceDto?> GetByIdAsync(int id);
    Task<DeviceDto> CreateAsync(Device device);
    Task<DeviceDto?> UpdateAsync(int id, Device device);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(string name, int? excludeId = null);
    Task<DeviceDto?> AssignAsync(int deviceId, int userId);
    Task<DeviceDto?> UnassignAsync(int deviceId);
    Task<IEnumerable<DeviceDto>> SearchAsync(string query);
}