using FoodOrdering.API.Models.DTOs;

namespace FoodOrdering.API.Services
{
    public interface IRazorpayService
    {
        Task<RazorpayOrderResponseDto> CreateOrderAsync(string userId);
        Task<string> VerifyAndCapturePaymentAsync(string userId, VerifyRazorpayPaymentDto dto);
    }
}
