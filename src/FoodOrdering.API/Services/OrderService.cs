using FoodOrdering.API.Data;
using FoodOrdering.API.Models.DTOs;
using FoodOrdering.API.Models.Entities;
using FoodOrdering.API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace FoodOrdering.API.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly ICartRepository _cartRepository;
        private readonly AppDbContext _db;

        public OrderService(IOrderRepository orderRepository, ICartRepository cartRepository, AppDbContext db)
        {
            _orderRepository = orderRepository;
            _cartRepository = cartRepository;
            _db = db;
        }

        public async Task<OrderDto> PlaceOrderAsync(string userId, PlaceOrderDto dto, string? paymentReference = null)
        {
            if (!string.IsNullOrWhiteSpace(paymentReference))
            {
                var existingOrder = await _db.Orders
                    .Include(order => order.User)
                    .Include(order => order.OrderItems).ThenInclude(item => item.Food)
                    .Include(order => order.Invoice)
                    .FirstOrDefaultAsync(order => order.PaymentReference == paymentReference);
                if (existingOrder != null)
                {
                    if (existingOrder.UserId != userId)
                        throw new InvalidOperationException("This payment is already associated with another account.");
                    return MapToDto(existingOrder);
                }
            }

            var paymentMethod = dto.PaymentMethod?.Trim();
            if (string.Equals(paymentMethod, "Razorpay", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(paymentReference))
                    throw new InvalidOperationException("Razorpay payments must be verified before an order is placed.");
                paymentMethod = "Razorpay";
            }
            else if (string.Equals(paymentMethod, "CashOnDelivery", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(paymentMethod))
            {
                if (!string.IsNullOrWhiteSpace(paymentReference))
                    throw new InvalidOperationException("A payment reference can only be used with Razorpay.");
                paymentMethod = "CashOnDelivery";
            }
            else
            {
                throw new InvalidOperationException("The selected payment method is not supported.");
            }

            var cartItems = (await _cartRepository.GetByUserIdAsync(userId)).ToList();
            if (!cartItems.Any())
            {
                throw new InvalidOperationException("Cart is empty. Add items before placing an order.");
            }

            var order = new Order
            {
                UserId = userId,
                DeliveryAddress = dto.DeliveryAddress,
                OrderDate = DateTime.UtcNow,
                Status = OrderStatus.Pending,
                TotalAmount = cartItems.Sum(ci => ci.Food.Price * ci.Quantity),
                PaymentMethod = paymentMethod,
                PaymentReference = paymentReference,
                OrderItems = cartItems.Select(ci => new OrderItem
                {
                    FoodId = ci.FoodId,
                    Quantity = ci.Quantity,
                    UnitPrice = ci.Food.Price
                }).ToList()
            };

            await _orderRepository.AddAsync(order);
            await _cartRepository.ClearCartAsync(userId);
            await CreateInvoiceAsync(order);

            // Re-fetch to include all navigations
            var result = await _orderRepository.GetByIdAsync(order.Id);
            return MapToDto(result!);
        }

        public async Task<IEnumerable<OrderDto>> GetUserOrdersAsync(string userId)
        {
            var orders = await _orderRepository.GetByUserIdAsync(userId);
            return orders.Select(MapToDto);
        }

        public async Task<OrderDto?> GetOrderByIdAsync(int id, string? userId = null)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return null;
            if (userId != null && order.UserId != userId) return null;
            return MapToDto(order);
        }

        public async Task<OrderDto?> GetOrderByPaymentReferenceAsync(string userId, string paymentReference)
        {
            var order = await _db.Orders
                .Include(item => item.User)
                .Include(item => item.OrderItems).ThenInclude(item => item.Food)
                .Include(item => item.Invoice)
                .FirstOrDefaultAsync(item => item.UserId == userId && item.PaymentReference == paymentReference);
            return order == null ? null : MapToDto(order);
        }

        public async Task<IEnumerable<OrderDto>> GetAllOrdersAsync()
        {
            var orders = await _orderRepository.GetAllAsync();
            return orders.Select(MapToDto);
        }

        public async Task<OrderDto> UpdateStatusAsync(int id, OrderStatus status)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null)
            {
                throw new KeyNotFoundException($"Order with id {id} not found.");
            }

            order.Status = status;
            await _orderRepository.UpdateAsync(order);
            return MapToDto(order);
        }

        public async Task<InvoiceDto?> GetInvoiceAsync(int orderId, string? userId = null)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) return null;
            if (userId != null && order.UserId != userId) return null;
            if (order.Invoice == null) return null;

            return new InvoiceDto
            {
                Id = order.Invoice.Id,
                OrderId = order.Invoice.OrderId,
                InvoiceNumber = order.Invoice.InvoiceNumber,
                GeneratedAt = order.Invoice.GeneratedAt,
                SubTotal = order.Invoice.SubTotal,
                Tax = order.Invoice.Tax,
                GrandTotal = order.Invoice.GrandTotal
            };
        }

        public async Task<InvoiceDto?> GenerateInvoiceAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) return null;

            if (order.Invoice == null)
            {
                await CreateInvoiceAsync(order);
                order = await _orderRepository.GetByIdAsync(orderId);
            }

            if (order?.Invoice == null) return null;
            return new InvoiceDto
            {
                Id = order.Invoice.Id,
                OrderId = order.Invoice.OrderId,
                InvoiceNumber = order.Invoice.InvoiceNumber,
                GeneratedAt = order.Invoice.GeneratedAt,
                SubTotal = order.Invoice.SubTotal,
                Tax = order.Invoice.Tax,
                GrandTotal = order.Invoice.GrandTotal
            };
        }

        public async Task<byte[]?> GetInvoicePdfAsync(int orderId, string? userId = null)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null || (userId != null && order.UserId != userId) || order.Invoice == null)
                return null;

            return InvoicePdfGenerator.Create(order);
        }

        private async Task CreateInvoiceAsync(Order order)
        {
            var tax = decimal.Round(order.TotalAmount * 0.10m, 0, MidpointRounding.AwayFromZero);
            var invoice = new Invoice
            {
                OrderId = order.Id,
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{order.Id:D5}",
                SubTotal = order.TotalAmount,
                Tax = tax,
                GrandTotal = order.TotalAmount + tax,
                GeneratedAt = DateTime.UtcNow
            };
            await _db.Invoices.AddAsync(invoice);
            await _db.SaveChangesAsync();
        }

        private static OrderDto MapToDto(Order order)
        {
            return new OrderDto
            {
                Id = order.Id,
                UserId = order.UserId,
                UserName = order.User?.FullName ?? string.Empty,
                UserEmail = order.User?.Email ?? string.Empty,
                OrderDate = order.OrderDate,
                Status = order.Status.ToString(),
                TotalAmount = order.TotalAmount,
                DeliveryAddress = order.DeliveryAddress,
                PaymentMethod = order.PaymentMethod,
                PaymentStatus = order.PaymentMethod == "Razorpay" ? "Paid" : "Pay on delivery",
                OrderItems = order.OrderItems?.Select(oi => new OrderItemDto
                {
                    Id = oi.Id,
                    FoodId = oi.FoodId,
                    FoodName = oi.Food?.Name ?? string.Empty,
                    FoodImageUrl = oi.Food?.ImageUrl ?? string.Empty,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    SubTotal = oi.UnitPrice * oi.Quantity
                }).ToList() ?? new List<OrderItemDto>(),
                Invoice = order.Invoice != null ? new InvoiceDto
                {
                    Id = order.Invoice.Id,
                    OrderId = order.Invoice.OrderId,
                    InvoiceNumber = order.Invoice.InvoiceNumber,
                    GeneratedAt = order.Invoice.GeneratedAt,
                    SubTotal = order.Invoice.SubTotal,
                    Tax = order.Invoice.Tax,
                    GrandTotal = order.Invoice.GrandTotal
                } : null
            };
        }
    }
}
