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
    public class PaymentController : ControllerBase
    {
        private readonly IRazorpayService _razorpayService;
        private readonly IOrderService _orderService;

        public PaymentController(IRazorpayService razorpayService, IOrderService orderService)
        {
            _razorpayService = razorpayService;
            _orderService = orderService;
        }

        [HttpPost("razorpay/order")]
        public async Task<IActionResult> CreateRazorpayOrder()
        {
            try
            {
                var result = await _razorpayService.CreateOrderAsync(GetUserId());
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (HttpRequestException)
            {
                return StatusCode(StatusCodes.Status502BadGateway,
                    new { message = "Could not connect to Razorpay. Please try again." });
            }
        }

        [HttpPost("razorpay/verify")]
        public async Task<IActionResult> VerifyRazorpayPayment([FromBody] VerifyRazorpayPaymentDto dto)
        {
            try
            {
                var existingOrder = await _orderService.GetOrderByPaymentReferenceAsync(GetUserId(), dto.RazorpayPaymentId);
                if (existingOrder != null) return Ok(existingOrder);

                var paymentReference = await _razorpayService.VerifyAndCapturePaymentAsync(GetUserId(), dto);
                var order = await _orderService.PlaceOrderAsync(GetUserId(), new PlaceOrderDto
                {
                    DeliveryAddress = dto.DeliveryAddress,
                    PaymentMethod = "Razorpay"
                }, paymentReference);
                return Ok(order);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (HttpRequestException)
            {
                return StatusCode(StatusCodes.Status502BadGateway,
                    new { message = "Could not verify the Razorpay payment. Please check your orders before retrying." });
            }
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    }
}
