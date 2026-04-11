using System.Text;
using System.Text.Json;
using DeviceManagement.API.DTOs;

namespace DeviceManagement.API.Services;

public class AiService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public AiService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Gemini:ApiKey"] ?? throw new ArgumentNullException("Gemini API Key missing");
    }

    public async Task<string> GenerateDescriptionAsync(GenerateDescriptionDto dto)
    {
        var systemInstruction = "You are an IT asset management assistant. " +
            "Create a single, concise, professional sentence, technically describing the device and it's uses based on the provided specs. " +
            "Do not list the specs directly. Do not use markdown, bolding, or bullet points.";

        var prompt = $"Name: {dto.Name}\n" +
                     $"Manufacturer: {dto.Manufacturer}\n" +
                     $"Type: {dto.Type}\n" +
                     $"OS: {dto.OS} {dto.OSVersion}\n" +
                     $"Processor: {dto.Processor}\n" +
                     $"RAM: {dto.RAM}GB";

        var requestBody = new
        {
            system_instruction = new { parts = new[] { new { text = systemInstruction } } },
            contents = new[] { new { parts = new[] { new { text = prompt } } } }
        };

        var json    = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var url     = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

        var response = await _http.PostAsync(url, content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            // Parse the error message from the Gemini response body if available,
            // otherwise fall back to the raw status description.
            string geminiMessage;
            try
            {
                using var errDoc = JsonDocument.Parse(responseBody);
                geminiMessage = errDoc.RootElement
                    .GetProperty("error")
                    .GetProperty("message")
                    .GetString() ?? response.ReasonPhrase ?? "Unknown error";
            }
            catch
            {
                geminiMessage = response.ReasonPhrase ?? $"HTTP {(int)response.StatusCode}";
            }

            throw new HttpRequestException($"Gemini API error: {geminiMessage}");
        }

        using var document = JsonDocument.Parse(responseBody);

        try
        {
            var text = document.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return text?.Trim() ?? string.Empty;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Could not parse Gemini API response.", ex);
        }
    }
}