using FoodOrdering.API.Data;
using FoodOrdering.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FoodOrdering.API.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly AppDbContext _db;

        public OrderRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Order> AddAsync(Order order)
        {
            _db.Orders.Add(order);
            await _db.SaveChangesAsync();
            return order;
        }

        public async Task<Order?> GetByIdAsync(int id)
        {
            return await _db.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Food)
                .Include(o => o.Invoice)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<IEnumerable<Order>> GetByUserIdAsync(string userId)
        {
            return await _db.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Food)
                .Include(o => o.Invoice)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Order>> GetAllAsync()
        {
            return await _db.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Food)
                .Include(o => o.Invoice)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Order> UpdateAsync(Order order)
        {
            _db.Orders.Update(order);
            await _db.SaveChangesAsync();
            return order;
        }
    }
}
