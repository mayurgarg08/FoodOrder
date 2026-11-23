using FoodOrdering.API.Data;
using FoodOrdering.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FoodOrdering.API.Repositories
{
    public class CartRepository : ICartRepository
    {
        private readonly AppDbContext _db;

        public CartRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<CartItem>> GetByUserIdAsync(string userId)
        {
            return await _db.CartItems
                .Include(ci => ci.Food)
                .ThenInclude(f => f.Category)
                .Where(ci => ci.UserId == userId)
                .OrderByDescending(ci => ci.AddedAt)
                .ToListAsync();
        }

        public async Task<CartItem?> GetByIdAsync(int id)
        {
            return await _db.CartItems
                .Include(ci => ci.Food)
                .FirstOrDefaultAsync(ci => ci.Id == id);
        }

        public async Task<CartItem?> GetByUserAndFoodAsync(string userId, int foodId)
        {
            return await _db.CartItems
                .Include(ci => ci.Food)
                .FirstOrDefaultAsync(ci => ci.UserId == userId && ci.FoodId == foodId);
        }

        public async Task<CartItem> AddAsync(CartItem item)
        {
            _db.CartItems.Add(item);
            await _db.SaveChangesAsync();
            return item;
        }

        public async Task<CartItem> UpdateAsync(CartItem item)
        {
            _db.CartItems.Update(item);
            await _db.SaveChangesAsync();
            return item;
        }

        public async Task DeleteAsync(int id)
        {
            var item = await _db.CartItems.FindAsync(id);
            if (item != null)
            {
                _db.CartItems.Remove(item);
                await _db.SaveChangesAsync();
            }
        }

        public async Task ClearCartAsync(string userId)
        {
            var items = await _db.CartItems.Where(ci => ci.UserId == userId).ToListAsync();
            _db.CartItems.RemoveRange(items);
            await _db.SaveChangesAsync();
        }

        public async Task<int> GetCartCountAsync(string userId)
        {
            return await _db.CartItems
                .Where(ci => ci.UserId == userId)
                .SumAsync(ci => ci.Quantity);
        }
    }
}
