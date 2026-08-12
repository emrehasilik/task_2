FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY ["Directory.Build.props", "Directory.Packages.props", "global.json", "./"]
COPY ["src/Services/Product/LocalCart.Product.Domain/LocalCart.Product.Domain.csproj", "src/Services/Product/LocalCart.Product.Domain/"]
COPY ["src/Services/Product/LocalCart.Product.Application/LocalCart.Product.Application.csproj", "src/Services/Product/LocalCart.Product.Application/"]
COPY ["src/Services/Product/LocalCart.Product.Infrastructure/LocalCart.Product.Infrastructure.csproj", "src/Services/Product/LocalCart.Product.Infrastructure/"]
COPY ["src/Services/Product/LocalCart.Product.Api/LocalCart.Product.Api.csproj", "src/Services/Product/LocalCart.Product.Api/"]
RUN dotnet restore "src/Services/Product/LocalCart.Product.Api/LocalCart.Product.Api.csproj"
COPY . .
RUN dotnet publish "src/Services/Product/LocalCart.Product.Api/LocalCart.Product.Api.csproj" -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "LocalCart.Product.Api.dll"]
