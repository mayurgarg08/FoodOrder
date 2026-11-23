FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["FoodOrdering.API/FoodOrdering.API.csproj", "FoodOrdering.API/"]
RUN dotnet restore "FoodOrdering.API/FoodOrdering.API.csproj"
COPY . .
WORKDIR "/src/FoodOrdering.API"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
RUN mkdir -p /app/uploads/images
COPY --from=publish /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "FoodOrdering.API.dll"]
