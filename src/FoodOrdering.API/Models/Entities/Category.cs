using System.ComponentModel.DataAnnotations;

namespace FoodOrdering.API.Models.Entities
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public ICollection<Food> Foods { get; set; } = new List<Food>();
    }
}
