using FoodOrdering.API.Data;
using FoodOrdering.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FoodOrdering.API.Repositories
{
    public class FoodRepository : IFoodRepository
    {
        private readonly AppDbContext _db;

        public FoodRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Food>> GetAllAsync(string? search, int? categoryId)
        {
            var query = _db.Foods
                .Include(f => f.Category)
                .Where(f => f.IsAvailable)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(f =>
                    f.Name.ToLower().Contains(search) ||
                    f.Description.ToLower().Contains(search));
            }

            if (categoryId.HasValue && categoryId.Value > 0)
            {
                query = query.Where(f => f.CategoryId == categoryId.Value);
            }

            return await query.OrderByDescending(f => f.CreatedAt).ToListAsync();
        }

        public async Task<Food?> GetByIdAsync(int id)
        {
            return await _db.Foods
                .Include(f => f.Category)
                .FirstOrDefaultAsync(f => f.Id == id);
        }

        public async Task<Food> AddAsync(Food food)
        {
            _db.Foods.Add(food);
            await _db.SaveChangesAsync();
            return await GetByIdAsync(food.Id) ?? food;
        }

        public async Task<Food> UpdateAsync(Food food)
        {
            _db.Foods.Update(food);
            await _db.SaveChangesAsync();
            return await GetByIdAsync(food.Id) ?? food;
        }

        public async Task DeleteAsync(int id)
        {
            var food = await _db.Foods.FindAsync(id);
            if (food != null)
            {
                food.IsAvailable = false;
                await _db.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _db.Foods.AnyAsync(f => f.Id == id);
        }
    }
}
