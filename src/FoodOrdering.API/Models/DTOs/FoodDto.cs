using System.ComponentModel.DataAnnotations;

namespace FoodOrdering.API.Models.DTOs
{
    public class FoodDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class FoodCreateDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 10000)]
        public decimal Price { get; set; }

        [Required]
        public int CategoryId { get; set; }

        public bool IsAvailable { get; set; } = true;

        public IFormFile? Image { get; set; }
    }

    public class FoodUpdateDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 10000)]
        public decimal Price { get; set; }

        [Required]
        public int CategoryId { get; set; }

        public bool IsAvailable { get; set; } = true;

        public IFormFile? Image { get; set; }
    }
}
