using FoodOrdering.API.Models.DTOs;
using FoodOrdering.API.Models.Entities;
using FoodOrdering.API.Repositories;

namespace FoodOrdering.API.Services
{
    public class FoodService : IFoodService
    {
        private readonly IFoodRepository _foodRepository;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;

        public FoodService(IFoodRepository foodRepository, IConfiguration configuration, IWebHostEnvironment env)
        {
            _foodRepository = foodRepository;
            _configuration = configuration;
            _env = env;
        }

        public async Task<IEnumerable<FoodDto>> GetAllAsync(string? search, int? categoryId)
        {
            var foods = await _foodRepository.GetAllAsync(search, categoryId);
            return foods.Select(MapToDto);
        }

        public async Task<FoodDto?> GetByIdAsync(int id)
        {
            var food = await _foodRepository.GetByIdAsync(id);
            return food != null ? MapToDto(food) : null;
        }

        public async Task<FoodDto> CreateAsync(FoodCreateDto dto)
        {
            var food = new Food
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                CategoryId = dto.CategoryId,
                IsAvailable = dto.IsAvailable,
                CreatedAt = DateTime.UtcNow
            };

            if (dto.Image != null)
            {
                food.ImageUrl = await SaveImageAsync(dto.Image);
            }

            var created = await _foodRepository.AddAsync(food);
            return MapToDto(created);
        }

        public async Task<FoodDto> UpdateAsync(int id, FoodUpdateDto dto)
        {
            var food = await _foodRepository.GetByIdAsync(id);
            if (food == null)
            {
                throw new KeyNotFoundException($"Food item with id {id} not found.");
            }

            food.Name = dto.Name;
            food.Description = dto.Description;
            food.Price = dto.Price;
            food.CategoryId = dto.CategoryId;
            food.IsAvailable = dto.IsAvailable;

            if (dto.Image != null)
            {
                food.ImageUrl = await SaveImageAsync(dto.Image);
            }

            var updated = await _foodRepository.UpdateAsync(food);
            return MapToDto(updated);
        }

        public async Task DeleteAsync(int id)
        {
            if (!await _foodRepository.ExistsAsync(id))
            {
                throw new KeyNotFoundException($"Food item with id {id} not found.");
            }
            await _foodRepository.DeleteAsync(id);
        }

        public async Task<string> UploadImageAsync(int id, IFormFile image)
        {
            var food = await _foodRepository.GetByIdAsync(id);
            if (food == null)
            {
                throw new KeyNotFoundException($"Food item with id {id} not found.");
            }

            food.ImageUrl = await SaveImageAsync(image);
            await _foodRepository.UpdateAsync(food);
            return food.ImageUrl;
        }

        private async Task<string> SaveImageAsync(IFormFile image)
        {
            var uploadPath = _configuration["FileStorage:UploadPath"] ?? Path.Combine(_env.ContentRootPath, "uploads", "images");
            Directory.CreateDirectory(uploadPath);

            var extension = Path.GetExtension(image.FileName);
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }

            return $"/uploads/images/{fileName}";
        }

        private static FoodDto MapToDto(Food food)
        {
            return new FoodDto
            {
                Id = food.Id,
                Name = food.Name,
                Description = food.Description,
                Price = food.Price,
                ImageUrl = food.ImageUrl,
                IsAvailable = food.IsAvailable,
                CategoryId = food.CategoryId,
                CategoryName = food.Category?.Name ?? string.Empty,
                CreatedAt = food.CreatedAt
            };
        }
    }
}
