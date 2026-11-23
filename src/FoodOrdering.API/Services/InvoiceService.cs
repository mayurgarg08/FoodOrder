using FoodOrdering.API.Data;
using FoodOrdering.API.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FoodOrdering.API.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly AppDbContext _db;

        public InvoiceService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<InvoiceDto?> GetByOrderIdAsync(int orderId)
        {
            var invoice = await _db.Invoices
                .FirstOrDefaultAsync(i => i.OrderId == orderId);

            if (invoice == null) return null;

            return new InvoiceDto
            {
                Id = invoice.Id,
                OrderId = invoice.OrderId,
                InvoiceNumber = invoice.InvoiceNumber,
                GeneratedAt = invoice.GeneratedAt,
                SubTotal = invoice.SubTotal,
                Tax = invoice.Tax,
                GrandTotal = invoice.GrandTotal
            };
        }

        public async Task<IEnumerable<InvoiceDto>> GetAllAsync()
        {
            return await _db.Invoices
                .OrderByDescending(i => i.GeneratedAt)
                .Select(i => new InvoiceDto
                {
                    Id = i.Id,
                    OrderId = i.OrderId,
                    InvoiceNumber = i.InvoiceNumber,
                    GeneratedAt = i.GeneratedAt,
                    SubTotal = i.SubTotal,
                    Tax = i.Tax,
                    GrandTotal = i.GrandTotal
                })
                .ToListAsync();
        }
    }
}
