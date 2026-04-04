using DeviceManagement.API.Models;
using DeviceManagement.API.Repositories;
using DeviceManagement.Tests.Helpers;

namespace DeviceManagement.Tests;

public class DeviceRepositoryTests
{
    [Fact]
    public async Task GetAllAsync_ReturnsAllDevices()
    {
        var db = TestDbFactory.Create();
        db.Devices.AddRange(
            new Device { Name = "iPhone 15", Manufacturer = "Apple", Type = "Phone", OS = "iOS", OSVersion = "17", Processor = "A17", RAM = 8 },
            new Device { Name = "Galaxy S24", Manufacturer = "Samsung", Type = "Phone", OS = "Android", OSVersion = "14", Processor = "SD8", RAM = 12 }
        );
        await db.SaveChangesAsync();

        var repo = new DeviceRepository(db);
        var result = await repo.GetAllAsync();

        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsCorrectDevice()
    {
        var db = TestDbFactory.Create();
        var device = new Device { Name = "iPhone 15", Manufacturer = "Apple", Type = "Phone", OS = "iOS", OSVersion = "17", Processor = "A17", RAM = 8 };
        db.Devices.Add(device);
        await db.SaveChangesAsync();

        var repo = new DeviceRepository(db);
        var result = await repo.GetByIdAsync(device.Id);

        Assert.NotNull(result);
        Assert.Equal("iPhone 15", result.Name);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
    {
        var db = TestDbFactory.Create();
        var repo = new DeviceRepository(db);

        var result = await repo.GetByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_AddsDeviceToDb()
    {
        var db = TestDbFactory.Create();
        var repo = new DeviceRepository(db);
        var device = new Device { Name = "Pixel 8", Manufacturer = "Google", Type = "Phone", OS = "Android", OSVersion = "14", Processor = "Tensor G3", RAM = 12 };

        var created = await repo.CreateAsync(device);

        Assert.NotEqual(0, created.Id);
        Assert.Equal(1, db.Devices.Count());
    }

    [Fact]
    public async Task UpdateAsync_UpdatesExistingDevice()
    {
        var db = TestDbFactory.Create();
        var device = new Device { Name = "iPad Pro", Manufacturer = "Apple", Type = "Tablet", OS = "iPadOS", OSVersion = "17", Processor = "M4", RAM = 16 };
        db.Devices.Add(device);
        await db.SaveChangesAsync();

        var repo = new DeviceRepository(db);
        var updated = new Device { Name = "iPad Pro", Manufacturer = "Apple", Type = "Tablet", OS = "iPadOS", OSVersion = "17.1", Processor = "M4", RAM = 16 };
        var result = await repo.UpdateAsync(device.Id, updated);

        Assert.NotNull(result);
        Assert.Equal("17.1", result.OSVersion);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNull_WhenDeviceNotFound()
    {
        var db = TestDbFactory.Create();
        var repo = new DeviceRepository(db);
        var updated = new Device { Name = "Ghost", Manufacturer = "X", Type = "Phone", OS = "iOS", OSVersion = "1", Processor = "X1", RAM = 4 };

        var result = await repo.UpdateAsync(999, updated);

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_RemovesDevice()
    {
        var db = TestDbFactory.Create();
        var device = new Device { Name = "iPhone 14", Manufacturer = "Apple", Type = "Phone", OS = "iOS", OSVersion = "17", Processor = "A15", RAM = 6 };
        db.Devices.Add(device);
        await db.SaveChangesAsync();

        var repo = new DeviceRepository(db);
        var result = await repo.DeleteAsync(device.Id);

        Assert.True(result);
        Assert.Equal(0, db.Devices.Count());
    }

    [Fact]
    public async Task DeleteAsync_ReturnsFalse_WhenNotFound()
    {
        var db = TestDbFactory.Create();
        var repo = new DeviceRepository(db);

        var result = await repo.DeleteAsync(999);

        Assert.False(result);
    }

    [Fact]
    public async Task ExistsAsync_ReturnsTrue_WhenNameExists()
    {
        var db = TestDbFactory.Create();
        db.Devices.Add(new Device { Name = "iPhone 15", Manufacturer = "Apple", Type = "Phone", OS = "iOS", OSVersion = "17", Processor = "A17", RAM = 8 });
        await db.SaveChangesAsync();

        var repo = new DeviceRepository(db);
        var result = await repo.ExistsAsync("iPhone 15");

        Assert.True(result);
    }

    [Fact]
    public async Task ExistsAsync_ReturnsFalse_WhenExcludingOwnId()
    {
        var db = TestDbFactory.Create();
        var device = new Device { Name = "iPhone 15", Manufacturer = "Apple", Type = "Phone", OS = "iOS", OSVersion = "17", Processor = "A17", RAM = 8 };
        db.Devices.Add(device);
        await db.SaveChangesAsync();

        var repo = new DeviceRepository(db);
        var result = await repo.ExistsAsync("iPhone 15", excludeId: device.Id);

        Assert.False(result);
    }
}