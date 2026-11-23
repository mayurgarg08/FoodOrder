using FoodOrdering.API.Models.DTOs;
using FoodOrdering.API.Models.Entities;

namespace FoodOrdering.API.Services
{
    public interface IOrderService
    {
        Task<OrderDto> PlaceOrderAsync(string userId, PlaceOrderDto dto, string? paymentReference = null);
        Task<IEnumerable<OrderDto>> GetUserOrdersAsync(string userId);
        Task<OrderDto?> GetOrderByIdAsync(int id, string? userId = null);
        Task<OrderDto?> GetOrderByPaymentReferenceAsync(string userId, string paymentReference);
        Task<IEnumerable<OrderDto>> GetAllOrdersAsync();
        Task<OrderDto> UpdateStatusAsync(int id, OrderStatus status);
        Task<InvoiceDto?> GetInvoiceAsync(int orderId, string? userId = null);
        Task<InvoiceDto?> GenerateInvoiceAsync(int orderId);
        Task<byte[]?> GetInvoicePdfAsync(int orderId, string? userId = null);
    }
}
