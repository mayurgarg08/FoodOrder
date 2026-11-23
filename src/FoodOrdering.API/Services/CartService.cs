using FoodOrdering.API.Models.DTOs;
using FoodOrdering.API.Models.Entities;
using FoodOrdering.API.Repositories;

namespace FoodOrdering.API.Services
{
    public class CartService : ICartService
    {
        private readonly ICartRepository _cartRepository;
        private readonly IFoodRepository _foodRepository;

        public CartService(ICartRepository cartRepository, IFoodRepository foodRepository)
        {
            _cartRepository = cartRepository;
            _foodRepository = foodRepository;
        }

        public async Task<CartResponseDto> GetCartAsync(string userId)
        {
            var items = await _cartRepository.GetByUserIdAsync(userId);
            var itemDtos = items.Select(MapToDto).ToList();

            return new CartResponseDto
            {
                Items = itemDtos,
                TotalAmount = itemDtos.Sum(i => i.SubTotal),
                TotalItems = itemDtos.Sum(i => i.Quantity)
            };
        }

        public async Task<CartItemResponseDto> AddToCartAsync(string userId, CartItemDto dto)
        {
            var food = await _foodRepository.GetByIdAsync(dto.FoodId);
            if (food == null || !food.IsAvailable)
            {
                throw new KeyNotFoundException("Food item not found or unavailable.");
            }

            // Check if item already exists in cart
            var existingItem = await _cartRepository.GetByUserAndFoodAsync(userId, dto.FoodId);
            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
                await _cartRepository.UpdateAsync(existingItem);
                return MapToDto(existingItem);
            }

            var cartItem = new CartItem
            {
                UserId = userId,
                FoodId = dto.FoodId,
                Quantity = dto.Quantity,
                AddedAt = DateTime.UtcNow
            };

            var added = await _cartRepository.AddAsync(cartItem);
            // Re-fetch to include Food navigation
            var result = await _cartRepository.GetByIdAsync(added.Id);
            return MapToDto(result!);
        }

        public async Task<CartItemResponseDto> UpdateQuantityAsync(string userId, int itemId, int quantity)
        {
            var item = await _cartRepository.GetByIdAsync(itemId);
            if (item == null || item.UserId != userId)
            {
                throw new KeyNotFoundException("Cart item not found.");
            }

            if (quantity <= 0)
            {
                await _cartRepository.DeleteAsync(itemId);
                throw new InvalidOperationException("Item removed from cart.");
            }

            item.Quantity = quantity;
            await _cartRepository.UpdateAsync(item);
            return MapToDto(item);
        }

        public async Task RemoveItemAsync(string userId, int itemId)
        {
            var item = await _cartRepository.GetByIdAsync(itemId);
            if (item == null || item.UserId != userId)
            {
                throw new KeyNotFoundException("Cart item not found.");
            }
            await _cartRepository.DeleteAsync(itemId);
        }

        public async Task ClearCartAsync(string userId)
        {
            await _cartRepository.ClearCartAsync(userId);
        }

        private static CartItemResponseDto MapToDto(CartItem item)
        {
            return new CartItemResponseDto
            {
                Id = item.Id,
                FoodId = item.FoodId,
                FoodName = item.Food?.Name ?? string.Empty,
                FoodImageUrl = item.Food?.ImageUrl ?? string.Empty,
                FoodPrice = item.Food?.Price ?? 0,
                Quantity = item.Quantity,
                SubTotal = (item.Food?.Price ?? 0) * item.Quantity,
                AddedAt = item.AddedAt
            };
        }
    }
}
