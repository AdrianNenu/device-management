using DeviceManagement.IntegrationTests.Helpers;

namespace DeviceManagement.IntegrationTests;

public class DevicesIntegrationTests : IClassFixture<IntegrationTestFactory>
{
    private readonly IntegrationTestFactory _factory;
    private readonly HttpClient _client;
    private readonly HttpClient _adminClient;
    private readonly HttpClient _managerClient;

    private static object DevicePayload(string name = "iPhone 15 Pro") => new
    {
        name,
        manufacturer = "Apple",
        type         = "Phone",
        os           = "iOS",
        osVersion    = "17.4",
        processor    = "A17 Pro",
        ram          = 8,
        description  = (string?)null
    };

    public DevicesIntegrationTests(IntegrationTestFactory factory)
    {
        _factory = factory;
        _client  = factory.CreateClient();

        _adminClient = factory.CreateClient();
        var adminToken = AuthHelper.RegisterAndLoginAsync(
            factory.CreateClient(), name: "Admin User",
            email: "admin.devices@example.com", password: "Admin123!",
            role: "Admin", location: "London").GetAwaiter().GetResult();
        _adminClient.SetBearerToken(adminToken);

        _managerClient = factory.CreateClient();
        var managerToken = AuthHelper.RegisterAndLoginAsync(
            factory.CreateClient(), name: "Manager User",
            email: "manager.devices@example.com", password: "Manager123!",
            role: "Manager", location: "London").GetAwaiter().GetResult();
        _managerClient.SetBearerToken(managerToken);
    }

    // ── Auth guard ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_Unauthenticated_Returns401()
    {
        var response = await _client.GetAsync("/api/devices");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET all ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_Authenticated_Returns200WithList()
    {
        var response = await _adminClient.GetAsync("/api/devices");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var devices = await response.Content.ReadFromJsonAsync<List<DeviceBody>>();
        Assert.NotNull(devices);
    }

    // ── POST ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_AsManager_Returns201WithDevice()
    {
        var response = await _managerClient.PostAsJsonAsync("/api/devices", DevicePayload("Pixel 8 Pro"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var device = await response.Content.ReadFromJsonAsync<DeviceBody>();
        Assert.NotNull(device);
        Assert.Equal("Pixel 8 Pro", device!.Name);
        Assert.True(device.Id > 0);
    }

    [Fact]
    public async Task Create_AsEmployee_Returns403()
    {
        // FIX: use factory.CreateClient() so the client uses the in-process handler
        var employeeClient = await CreateEmployeeClientAsync("emp.create@example.com");
        var response = await employeeClient.PostAsJsonAsync("/api/devices", DevicePayload("Should Fail"));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_DuplicateName_Returns409()
    {
        await _managerClient.PostAsJsonAsync("/api/devices", DevicePayload("Duplicate Device"));
        var second = await _managerClient.PostAsJsonAsync("/api/devices", DevicePayload("Duplicate Device"));
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Create_InvalidType_Returns400()
    {
        var response = await _managerClient.PostAsJsonAsync("/api/devices", new
        {
            name = "Bad Type Device", manufacturer = "Test", type = "Laptop",
            os = "Windows", osVersion = "11", processor = "i7", ram = 16
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── GET by ID ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ExistingDevice_Returns200()
    {
        var created = await CreateDeviceAsync("GetById Test Device");
        var response = await _adminClient.GetAsync($"/api/devices/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var device = await response.Content.ReadFromJsonAsync<DeviceBody>();
        Assert.Equal("GetById Test Device", device!.Name);
    }

    [Fact]
    public async Task GetById_NonExistent_Returns404()
    {
        var response = await _adminClient.GetAsync("/api/devices/999999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── PUT ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_AsManager_Returns200WithUpdatedData()
    {
        var created = await CreateDeviceAsync("Update Me");
        var response = await _managerClient.PutAsJsonAsync($"/api/devices/{created.Id}", new
        {
            name = "Updated Name", manufacturer = "Samsung", type = "Tablet",
            os = "Android", osVersion = "14", processor = "Snapdragon 8 Gen 3",
            ram = 12, description = "Updated"
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<DeviceBody>();
        Assert.Equal("Updated Name", updated!.Name);
        Assert.Equal("Tablet", updated.Type);
        Assert.Equal(12, updated.Ram);
    }

    [Fact]
    public async Task Update_NonExistent_Returns404()
    {
        var response = await _managerClient.PutAsJsonAsync("/api/devices/999999", DevicePayload("Ghost"));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Update_AsEmployee_Returns403()
    {
        var created = await CreateDeviceAsync("Employee Cannot Edit");
        var employeeClient = await CreateEmployeeClientAsync("emp.update@example.com");
        var response = await employeeClient.PutAsJsonAsync($"/api/devices/{created.Id}", DevicePayload("Hacked"));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ── DELETE ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_AsAdmin_Returns204AndDeviceGone()
    {
        var created = await CreateDeviceAsync("Delete Me");
        var deleteResponse = await _adminClient.DeleteAsync($"/api/devices/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        var getResponse = await _adminClient.GetAsync($"/api/devices/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Delete_AsManager_Returns403()
    {
        var created = await CreateDeviceAsync("Manager Cannot Delete");
        var response = await _managerClient.DeleteAsync($"/api/devices/{created.Id}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Delete_NonExistent_Returns404()
    {
        var response = await _adminClient.DeleteAsync("/api/devices/999999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Search ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Search_ByName_ReturnsMatchingDevices()
    {
        await CreateDeviceAsync("Searchable iPhone X");
        await CreateDeviceAsync("Searchable Galaxy Y");

        var response = await _adminClient.GetAsync("/api/devices/search?q=Searchable+iPhone");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var results = await response.Content.ReadFromJsonAsync<List<DeviceBody>>();
        Assert.NotNull(results);
        Assert.Contains(results!, d => d.Name == "Searchable iPhone X");
        Assert.Equal("Searchable iPhone X", results![0].Name);
    }

    [Fact]
    public async Task Search_WithQuery_ReturnsSubsetOfAllDevices()
    {
        // Create two devices with distinct names
        await CreateDeviceAsync("Search Subset Apple");
        await CreateDeviceAsync("Search Subset Samsung");

        var allResponse    = await _adminClient.GetAsync("/api/devices");
        var searchResponse = await _adminClient.GetAsync("/api/devices/search?q=Apple");

        Assert.Equal(HttpStatusCode.OK, allResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, searchResponse.StatusCode);

        var allDevices    = await allResponse.Content.ReadFromJsonAsync<List<DeviceBody>>();
        var searchDevices = await searchResponse.Content.ReadFromJsonAsync<List<DeviceBody>>();

        Assert.NotNull(allDevices);
        Assert.NotNull(searchDevices);
        // Search results should be a non-empty subset
        Assert.True(searchDevices!.Count > 0);
        Assert.True(searchDevices.Count <= allDevices!.Count);
        Assert.All(searchDevices, d =>
            Assert.True(
                d.Name.Contains("Apple", StringComparison.OrdinalIgnoreCase) ||
                d.Manufacturer.Contains("Apple", StringComparison.OrdinalIgnoreCase) ||
                d.Processor.Contains("Apple", StringComparison.OrdinalIgnoreCase)
            ));
    }

    // ── Assign / Unassign ────────────────────────────────────────────────

    [Fact]
    public async Task Assign_AvailableDevice_Returns200WithAssignment()
    {
        var device = await CreateDeviceAsync("Assignable Device");
        var employeeClient = await CreateEmployeeClientAsync("emp.assign@example.com");

        var response = await employeeClient.PostAsJsonAsync($"/api/devices/{device.Id}/assign", new { });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updated = await response.Content.ReadFromJsonAsync<DeviceBody>();
        Assert.NotNull(updated!.AssignedUserId);
        Assert.NotNull(updated.AssignedUserName);
    }

    [Fact]
    public async Task Assign_AlreadyAssignedDevice_Returns409()
    {
        var device = await CreateDeviceAsync("Already Assigned Device");

        var emp1 = await CreateEmployeeClientAsync("emp.assign1@example.com");
        await emp1.PostAsJsonAsync($"/api/devices/{device.Id}/assign", new { });

        var emp2 = await CreateEmployeeClientAsync("emp.assign2@example.com");
        var response = await emp2.PostAsJsonAsync($"/api/devices/{device.Id}/assign", new { });
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Unassign_OwnDevice_Returns200WithNullAssignment()
    {
        var device = await CreateDeviceAsync("Unassignable Device");
        var employeeClient = await CreateEmployeeClientAsync("emp.unassign@example.com");

        await employeeClient.PostAsJsonAsync($"/api/devices/{device.Id}/assign", new { });
        var response = await employeeClient.PostAsJsonAsync($"/api/devices/{device.Id}/unassign", new { });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updated = await response.Content.ReadFromJsonAsync<DeviceBody>();
        Assert.Null(updated!.AssignedUserId);
        Assert.Null(updated.AssignedUserName);
    }

    [Fact]
    public async Task Unassign_SomeoneElsesDevice_AsEmployee_Returns403()
    {
        var device = await CreateDeviceAsync("Others Device");
        var emp1 = await CreateEmployeeClientAsync("emp.others1@example.com");
        var emp2 = await CreateEmployeeClientAsync("emp.others2@example.com");

        await emp1.PostAsJsonAsync($"/api/devices/{device.Id}/assign", new { });
        var response = await emp2.PostAsJsonAsync($"/api/devices/{device.Id}/unassign", new { });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Unassign_SomeoneElsesDevice_AsManager_Returns200()
    {
        var device = await CreateDeviceAsync("Manager Unassign Device");
        var employee = await CreateEmployeeClientAsync("emp.mgrunassign@example.com");

        await employee.PostAsJsonAsync($"/api/devices/{device.Id}/assign", new { });
        var response = await _managerClient.PostAsJsonAsync($"/api/devices/{device.Id}/unassign", new { });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private async Task<DeviceBody> CreateDeviceAsync(string name)
    {
        var response = await _managerClient.PostAsJsonAsync("/api/devices", DevicePayload(name));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<DeviceBody>())!;
    }

    private async Task<HttpClient> CreateEmployeeClientAsync(string email)
    {
        // MUST use _factory.CreateClient() — not new HttpClient() — so the
        // in-process test handler is used instead of a real TCP connection.
        var client = _factory.CreateClient();
        var token  = await AuthHelper.RegisterAndLoginAsync(
            _factory.CreateClient(), email: email, role: "Employee");
        client.SetBearerToken(token);
        return client;
    }

    private record DeviceBody(
        int     Id,
        string  Name,
        string  Manufacturer,
        string  Type,
        string  Os,
        string  OsVersion,
        string  Processor,
        int     Ram,
        string? Description,
        int?    AssignedUserId,
        string? AssignedUserName);
}