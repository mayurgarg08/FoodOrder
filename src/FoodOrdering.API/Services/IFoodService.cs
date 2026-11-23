using FoodOrdering.API.Models.DTOs;

namespace FoodOrdering.API.Services
{
    public interface IFoodService
    {
        Task<IEnumerable<FoodDto>> GetAllAsync(string? search, int? categoryId);
        Task<FoodDto?> GetByIdAsync(int id);
        Task<FoodDto> CreateAsync(FoodCreateDto dto);
        Task<FoodDto> UpdateAsync(int id, FoodUpdateDto dto);
        Task DeleteAsync(int id);
        Task<string> UploadImageAsync(int id, IFormFile image);
    }
}
