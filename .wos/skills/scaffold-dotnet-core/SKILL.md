# .NET 9 Web API Expert Scaffold (Backend Expert)

Estrutura profissional para APIs empresariais de alta performance usando o ecossistema .NET mais recente.

## 📁 Estrutura de Pastas (Clean Architecture)

```text
/src
  /API             # Camada de entrada (Controllers e Program.cs)
  /Application     # Lógica de negócio, Interfaces e DTOs
  /Domain          # Entidades de Domínio e Business Rules
  /Infrastructure  # Persistência (EF Core) e Serviços externos
/tests
  /UnitTests       # Testes unitários (xUnit)
  /IntegrationTests # Testes de integração
Solution.sln
Dockerfile
```

## 🛠️ Comandos de Inicialização

1. **Criação**: `dotnet new webapi -n ProjectName`
2. **Dependências Core**: `dotnet add package Microsoft.EntityFrameworkCore.SqlServer`
3. **Swagger/OpenAPI**: `dotnet add package Swashbuckle.AspNetCore`
4. **Execução**: `dotnet run --project src/API`

## 📄 Boilerplate: src/API/Program.cs (Modern Minimal API)

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.useSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

## 📄 Boilerplate: appsettings.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=wos_db;Trusted_Connection=True;MultipleActiveResultSets=true"
  }
}
```
