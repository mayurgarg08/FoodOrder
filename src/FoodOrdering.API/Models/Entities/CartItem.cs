using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodOrdering.API.Models.Entities
{
    public class CartItem
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        public int FoodId { get; set; }

        [ForeignKey(nameof(FoodId))]
        public Food Food { get; set; } = null!;

        [Range(1, 100)]
        public int Quantity { get; set; }

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
