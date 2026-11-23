using FoodOrdering.API.Data;
using FoodOrdering.API.Models.DTOs;
using FoodOrdering.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodOrdering.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CategoryController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _db.Categories
                .Where(c => c.IsActive)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    IsActive = c.IsActive
                })
                .ToListAsync();
            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _db.Categories.FindAsync(id);
            if (category == null) return NotFound(new { message = "Category not found." });
            return Ok(new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                ImageUrl = category.ImageUrl,
                IsActive = category.IsActive
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CategoryDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                IsActive = dto.IsActive
            };
            _db.Categories.Add(category);
            await _db.SaveChangesAsync();

            dto.Id = category.Id;
            return CreatedAtAction(nameof(GetById), new { id = category.Id }, dto);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] CategoryDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var category = await _db.Categories.FindAsync(id);
            if (category == null) return NotFound(new { message = "Category not found." });

            category.Name = dto.Name;
            category.Description = dto.Description;
            category.ImageUrl = dto.ImageUrl;
            category.IsActive = dto.IsActive;
            await _db.SaveChangesAsync();

            return Ok(dto);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _db.Categories.FindAsync(id);
            if (category == null) return NotFound(new { message = "Category not found." });

            category.IsActive = false;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Category deleted successfully." });
        }
    }
}
