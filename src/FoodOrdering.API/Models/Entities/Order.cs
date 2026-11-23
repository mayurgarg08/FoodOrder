using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodOrdering.API.Models.Entities
{
    public class Order
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; } = null!;

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [MaxLength(500)]
        public string DeliveryAddress { get; set; } = string.Empty;

        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "CashOnDelivery";

        [MaxLength(100)]
        public string? PaymentReference { get; set; }

        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

        public Invoice? Invoice { get; set; }
    }

    public enum OrderStatus
    {
        Pending,
        Confirmed,
        Preparing,
        OutForDelivery,
        Delivered,
        Cancelled
    }
}
