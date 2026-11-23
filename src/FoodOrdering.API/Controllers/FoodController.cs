using FoodOrdering.API.Models.DTOs;
using FoodOrdering.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodOrdering.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FoodController : ControllerBase
    {
        private readonly IFoodService _foodService;

        public FoodController(IFoodService foodService)
        {
            _foodService = foodService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int? categoryId)
        {
            var foods = await _foodService.GetAllAsync(search, categoryId);
            return Ok(foods);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var food = await _foodService.GetByIdAsync(id);
            if (food == null) return NotFound(new { message = "Food item not found." });
            return Ok(food);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromForm] FoodCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var food = await _foodService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = food.Id }, food);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromForm] FoodUpdateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var food = await _foodService.UpdateAsync(id, dto);
                return Ok(food);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _foodService.DeleteAsync(id);
                return Ok(new { message = "Food item deleted successfully." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/upload-image")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadImage(int id, IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest(new { message = "No image file provided." });

            try
            {
                var imageUrl = await _foodService.UploadImageAsync(id, image);
                return Ok(new { imageUrl });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
