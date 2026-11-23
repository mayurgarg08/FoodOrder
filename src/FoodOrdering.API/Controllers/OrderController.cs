using System.Security.Claims;
using FoodOrdering.API.Models.DTOs;
using FoodOrdering.API.Models.Entities;
using FoodOrdering.API.Hubs;
using FoodOrdering.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace FoodOrdering.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly IHubContext<OrderTrackingHub> _orderTrackingHub;

        public OrderController(IOrderService orderService, IHubContext<OrderTrackingHub> orderTrackingHub)
        {
            _orderService = orderService;
            _orderTrackingHub = orderTrackingHub;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        [HttpPost("place")]
        public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var order = await _orderService.PlaceOrderAsync(GetUserId(), dto);
                return Ok(order);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders()
        {
            var orders = await _orderService.GetUserOrdersAsync(GetUserId());
            return Ok(orders);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var isAdmin = User.IsInRole("Admin");
            var order = await _orderService.GetOrderByIdAsync(id, isAdmin ? null : GetUserId());
            if (order == null) return NotFound(new { message = "Order not found." });
            return Ok(order);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            try
            {
                var order = await _orderService.UpdateStatusAsync(id, dto.Status);
                await _orderTrackingHub.Clients
                    .Group(OrderTrackingHub.GroupName(id))
                    .SendAsync("OrderStatusUpdated", new
                    {
                        orderId = order.Id,
                        status = order.Status,
                        updatedAt = DateTime.UtcNow
                    });
                return Ok(order);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _orderService.GetAllOrdersAsync();
            return Ok(orders);
        }

        [HttpGet("{id}/invoice")]
        public async Task<IActionResult> GetInvoice(int id)
        {
            var isAdmin = User.IsInRole("Admin");
            var invoice = await _orderService.GetInvoiceAsync(id, isAdmin ? null : GetUserId());
            if (invoice == null) return NotFound(new { message = "Invoice not found." });
            return Ok(invoice);
        }

        [HttpPost("{id}/invoice/generate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateInvoice(int id)
        {
            var invoice = await _orderService.GenerateInvoiceAsync(id);
            if (invoice == null) return NotFound(new { message = "Order not found." });
            return Ok(invoice);
        }

        [HttpGet("{id}/invoice/pdf")]
        public async Task<IActionResult> DownloadInvoicePdf(int id)
        {
            var isAdmin = User.IsInRole("Admin");
            var pdf = await _orderService.GetInvoicePdfAsync(id, isAdmin ? null : GetUserId());
            if (pdf == null) return NotFound(new { message = "Invoice not found." });

            return File(pdf, "application/pdf", $"invoice-order-{id}.pdf");
        }
    }
}
