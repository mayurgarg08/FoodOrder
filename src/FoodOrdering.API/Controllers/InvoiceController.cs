using System.Security.Claims;
using FoodOrdering.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodOrdering.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;
        private readonly IOrderService _orderService;

        public InvoiceController(IInvoiceService invoiceService, IOrderService orderService)
        {
            _invoiceService = invoiceService;
            _orderService = orderService;
        }

        [HttpGet("order/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetByOrderId(int orderId)
        {
            var isAdmin = User.IsInRole("Admin");
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var invoice = await _orderService.GetInvoiceAsync(orderId, isAdmin ? null : userId ?? string.Empty);
            if (invoice == null) return NotFound(new { message = "Invoice not found." });
            return Ok(invoice);
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var invoices = await _invoiceService.GetAllAsync();
            return Ok(invoices);
        }
    }
}
