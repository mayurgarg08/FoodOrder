using FoodOrdering.API.Models.DTOs;

namespace FoodOrdering.API.Services
{
    public interface ICartService
    {
        Task<CartResponseDto> GetCartAsync(string userId);
        Task<CartItemResponseDto> AddToCartAsync(string userId, CartItemDto dto);
        Task<CartItemResponseDto> UpdateQuantityAsync(string userId, int itemId, int quantity);
        Task RemoveItemAsync(string userId, int itemId);
        Task ClearCartAsync(string userId);
    }
}
