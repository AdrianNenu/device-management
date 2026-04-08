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
        // 1. Build the prompt based on the task instructions
        var prompt = $"Generate a human-readable, concise, and informative description for a device with the following specs. Only output one short sentence, no need to name all the specs. Do not use bolding or bullet points.\n" +
                     $"Name: {dto.Name}\n" +
                     $"Manufacturer: {dto.Manufacturer}\n" +
                     $"Type: {dto.Type}\n" +
                     $"OS: {dto.OS} {dto.OSVersion}\n" +
                     $"Processor: {dto.Processor}\n" +
                     $"RAM: {dto.RAM}GB";

        // 2. Format the payload for the Gemini API
        var requestBody = new { contents = new[] { new { parts = new[] { new { text = prompt } } } } };
        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // 3. Make the API call to Gemini 1.5 Flash
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";
        var response = await _http.PostAsync(url, content);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            return $"API Error: {response.StatusCode} - {errorBody}";
        }

        // 4. Parse the response
        var responseJson = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(responseJson);

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
        catch
        {
            return "Could not parse AI response.";
        }
    }
}