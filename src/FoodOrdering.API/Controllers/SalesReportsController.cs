using FoodOrdering.API.Data;
using FoodOrdering.API.Models.Entities;
using FoodOrdering.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodOrdering.API.Controllers;

[ApiController]
[Route("api/admin/reports")]
[Authorize(Roles = "Admin")]
public class SalesReportsController : ControllerBase
{
    private static readonly TimeSpan IndiaOffset = TimeSpan.FromHours(5.5);
    private readonly AppDbContext _db;

    public SalesReportsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("sales")]
    public async Task<IActionResult> DownloadSalesReport(
        [FromQuery] string period = "daily",
        [FromQuery] DateOnly? date = null,
        [FromQuery] string format = "pdf",
        CancellationToken cancellationToken = default)
    {
        period = period.Trim().ToLowerInvariant();
        format = format.Trim().ToLowerInvariant();

        if (period is not ("daily" or "weekly" or "monthly"))
            return BadRequest(new { message = "Period must be daily, weekly or monthly." });
        if (format is not ("pdf" or "excel"))
            return BadRequest(new { message = "Format must be pdf or excel." });

        var selectedDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.Add(IndiaOffset));
        var (startDate, endDate) = GetDateRange(period, selectedDate);
        var startUtc = new DateTimeOffset(startDate.ToDateTime(TimeOnly.MinValue), IndiaOffset).UtcDateTime;
        var endUtc = new DateTimeOffset(endDate.AddDays(1).ToDateTime(TimeOnly.MinValue), IndiaOffset).UtcDateTime;

        var orders = await _db.Orders
            .AsNoTracking()
            .Include(order => order.User)
            .Include(order => order.OrderItems)
                .ThenInclude(item => item.Food)
            .Where(order => order.OrderDate >= startUtc && order.OrderDate < endUtc)
            .OrderByDescending(order => order.OrderDate)
            .ToListAsync(cancellationToken);

        var safePeriod = $"{period}-{startDate:yyyyMMdd}-{endDate:yyyyMMdd}";
        if (format == "excel")
        {
            var workbook = SalesReportGenerator.CreateExcel(orders, period, startDate, endDate);
            return File(workbook,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"foodorder-sales-{safePeriod}.xlsx");
        }

        var pdf = SalesReportGenerator.CreatePdf(orders, period, startDate, endDate);
        return File(pdf, "application/pdf", $"foodorder-sales-{safePeriod}.pdf");
    }

    private static (DateOnly StartDate, DateOnly EndDate) GetDateRange(string period, DateOnly selectedDate)
    {
        return period switch
        {
            "weekly" => GetWeekRange(selectedDate),
            "monthly" => GetMonthRange(selectedDate),
            _ => (selectedDate, selectedDate)
        };
    }

    private static (DateOnly StartDate, DateOnly EndDate) GetWeekRange(DateOnly selectedDate)
    {
        var daysSinceMonday = ((int)selectedDate.DayOfWeek + 6) % 7;
        var monday = selectedDate.AddDays(-daysSinceMonday);
        return (monday, monday.AddDays(6));
    }

    private static (DateOnly StartDate, DateOnly EndDate) GetMonthRange(DateOnly selectedDate)
    {
        var firstDay = new DateOnly(selectedDate.Year, selectedDate.Month, 1);
        return (firstDay, firstDay.AddMonths(1).AddDays(-1));
    }
}
