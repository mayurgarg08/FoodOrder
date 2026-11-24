FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["FoodOrdering.API/FoodOrdering.API.csproj", "FoodOrdering.API/"]
RUN dotnet restore "FoodOrdering.API/FoodOrdering.API.csproj"

COPY . .
WORKDIR "/src/FoodOrdering.API"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

RUN mkdir -p /app/uploads/images
COPY --from=build /app/publish .

EXPOSE 10000
ENV ASPNETCORE_URLS=http://+:10000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "FoodOrdering.API.dll"]
