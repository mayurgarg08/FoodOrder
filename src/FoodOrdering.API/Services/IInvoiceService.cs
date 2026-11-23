using FoodOrdering.API.Models.DTOs;

namespace FoodOrdering.API.Services
{
    public interface IInvoiceService
    {
        Task<InvoiceDto?> GetByOrderIdAsync(int orderId);
        Task<IEnumerable<InvoiceDto>> GetAllAsync();
    }
}
