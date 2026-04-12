// This file makes the top-level Program class visible to the integration test project.
// WebApplicationFactory<Program> requires this — without it the test project cannot
// reference the entry point type.
// Place this file in the backend project (next to Program.cs).

// ReSharper disable once CheckNamespace
public partial class Program { }