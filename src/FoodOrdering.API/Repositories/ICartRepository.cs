using FoodOrdering.API.Models.Entities;

namespace FoodOrdering.API.Repositories
{
    public interface ICartRepository
    {
        Task<IEnumerable<CartItem>> GetByUserIdAsync(string userId);
        Task<CartItem?> GetByIdAsync(int id);
        Task<CartItem?> GetByUserAndFoodAsync(string userId, int foodId);
        Task<CartItem> AddAsync(CartItem item);
        Task<CartItem> UpdateAsync(CartItem item);
        Task DeleteAsync(int id);
        Task ClearCartAsync(string userId);
        Task<int> GetCartCountAsync(string userId);
    }
}
