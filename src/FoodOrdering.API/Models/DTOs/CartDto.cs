using System.ComponentModel.DataAnnotations;

namespace FoodOrdering.API.Models.DTOs
{
    public class CartItemDto
    {
        [Required]
        public int FoodId { get; set; }

        [Range(1, 100)]
        public int Quantity { get; set; } = 1;
    }

    public class CartItemResponseDto
    {
        public int Id { get; set; }
        public int FoodId { get; set; }
        public string FoodName { get; set; } = string.Empty;
        public string FoodImageUrl { get; set; } = string.Empty;
        public decimal FoodPrice { get; set; }
        public int Quantity { get; set; }
        public decimal SubTotal { get; set; }
        public DateTime AddedAt { get; set; }
    }

    public class CartResponseDto
    {
        public List<CartItemResponseDto> Items { get; set; } = new();
        public decimal TotalAmount { get; set; }
        public int TotalItems { get; set; }
    }

    public class CategoryDto
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
    }
}
