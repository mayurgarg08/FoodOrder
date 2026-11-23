using FoodOrdering.API.Models.Entities;

namespace FoodOrdering.API.Repositories
{
    public interface IFoodRepository
    {
        Task<IEnumerable<Food>> GetAllAsync(string? search, int? categoryId);
        Task<Food?> GetByIdAsync(int id);
        Task<Food> AddAsync(Food food);
        Task<Food> UpdateAsync(Food food);
        Task DeleteAsync(int id);
        Task<bool> ExistsAsync(int id);
    }
}
