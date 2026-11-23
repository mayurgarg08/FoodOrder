using System.ComponentModel.DataAnnotations;
using FoodOrdering.API.Models.Entities;

namespace FoodOrdering.API.Models.DTOs
{
    public class PlaceOrderDto
    {
        [Required]
        [MaxLength(500)]
        public string DeliveryAddress { get; set; } = string.Empty;

        public string PaymentMethod { get; set; } = "CashOnDelivery";
    }

    public class OrderDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string DeliveryAddress { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = "CashOnDelivery";
        public string PaymentStatus { get; set; } = "Pending";
        public List<OrderItemDto> OrderItems { get; set; } = new();
        public InvoiceDto? Invoice { get; set; }
    }

    public class OrderItemDto
    {
        public int Id { get; set; }
        public int FoodId { get; set; }
        public string FoodName { get; set; } = string.Empty;
        public string FoodImageUrl { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal SubTotal { get; set; }
    }

    public class InvoiceDto
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public decimal SubTotal { get; set; }
        public decimal Tax { get; set; }
        public decimal GrandTotal { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        [Required]
        public OrderStatus Status { get; set; }
    }

    public class RazorpayOrderResponseDto
    {
        public string KeyId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public long Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
    }

    public class VerifyRazorpayPaymentDto
    {
        [Required]
        public string RazorpayOrderId { get; set; } = string.Empty;

        [Required]
        public string RazorpayPaymentId { get; set; } = string.Empty;

        [Required]
        public string RazorpaySignature { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string DeliveryAddress { get; set; } = string.Empty;
    }
}
