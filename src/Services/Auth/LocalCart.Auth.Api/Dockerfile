FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY ["Directory.Build.props", "Directory.Packages.props", "global.json", "./"]
COPY ["src/Services/Auth/LocalCart.Auth.Domain/LocalCart.Auth.Domain.csproj", "src/Services/Auth/LocalCart.Auth.Domain/"]
COPY ["src/Services/Auth/LocalCart.Auth.Application/LocalCart.Auth.Application.csproj", "src/Services/Auth/LocalCart.Auth.Application/"]
COPY ["src/Services/Auth/LocalCart.Auth.Infrastructure/LocalCart.Auth.Infrastructure.csproj", "src/Services/Auth/LocalCart.Auth.Infrastructure/"]
COPY ["src/Services/Auth/LocalCart.Auth.Api/LocalCart.Auth.Api.csproj", "src/Services/Auth/LocalCart.Auth.Api/"]
RUN dotnet restore "src/Services/Auth/LocalCart.Auth.Api/LocalCart.Auth.Api.csproj"
COPY . .
RUN dotnet publish "src/Services/Auth/LocalCart.Auth.Api/LocalCart.Auth.Api.csproj" -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "LocalCart.Auth.Api.dll"]
