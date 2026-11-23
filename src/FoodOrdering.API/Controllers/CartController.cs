using System.Security.Claims;
using FoodOrdering.API.Models.DTOs;
using FoodOrdering.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodOrdering.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var cart = await _cartService.GetCartAsync(GetUserId());
            return Ok(cart);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] CartItemDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var item = await _cartService.AddToCartAsync(GetUserId(), dto);
                return Ok(item);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut("update/{itemId}")]
        public async Task<IActionResult> UpdateQuantity(int itemId, [FromBody] int qty)
        {
            try
            {
                var item = await _cartService.UpdateQuantityAsync(GetUserId(), itemId, qty);
                return Ok(item);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Ok(new { message = ex.Message });
            }
        }

        [HttpDelete("remove/{itemId}")]
        public async Task<IActionResult> RemoveItem(int itemId)
        {
            try
            {
                await _cartService.RemoveItemAsync(GetUserId(), itemId);
                return Ok(new { message = "Item removed from cart." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            await _cartService.ClearCartAsync(GetUserId());
            return Ok(new { message = "Cart cleared." });
        }
    }
}
