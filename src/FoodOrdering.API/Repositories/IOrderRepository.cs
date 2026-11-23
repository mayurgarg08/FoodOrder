using FoodOrdering.API.Models.Entities;

namespace FoodOrdering.API.Repositories
{
    public interface IOrderRepository
    {
        Task<Order> AddAsync(Order order);
        Task<Order?> GetByIdAsync(int id);
        Task<IEnumerable<Order>> GetByUserIdAsync(string userId);
        Task<IEnumerable<Order>> GetAllAsync();
        Task<Order> UpdateAsync(Order order);
    }
}
