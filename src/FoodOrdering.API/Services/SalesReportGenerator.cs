using System.Globalization;
using ClosedXML.Excel;
using FoodOrdering.API.Models.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FoodOrdering.API.Services;

internal static class SalesReportGenerator
{
    private static readonly CultureInfo IndianCulture = CultureInfo.GetCultureInfo("en-IN");
    private static readonly TimeSpan IndiaOffset = TimeSpan.FromHours(5.5);

    public static byte[] CreatePdf(IReadOnlyCollection<Order> orders, string period, DateOnly startDate, DateOnly endDate)
    {
        QuestPDF.Settings.License = LicenseType.Community;
        var salesOrders = orders.Where(order => order.Status != OrderStatus.Cancelled).ToList();
        var salesRevenue = salesOrders.Sum(order => order.TotalAmount);
        var averageOrder = salesOrders.Count == 0 ? 0 : salesRevenue / salesOrders.Count;

        var document = Document.Create(container => container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(32);
            page.DefaultTextStyle(style => style.FontFamily("Lato").FontSize(9).FontColor("#20242D"));
            page.Header().Column(header =>
            {
                header.Item().Text("FOODORDER").FontSize(11).Bold().FontColor("#D9381E");
                header.Item().PaddingTop(5).Text("SALES REPORT").FontSize(24).Bold();
                header.Item().PaddingTop(4).Text($"{TitleCase(period)} report  |  {startDate:dd MMM yyyy} - {endDate:dd MMM yyyy}")
                    .FontSize(10).FontColor("#64748B");
                header.Item().PaddingTop(14).LineHorizontal(2).LineColor("#D9381E");
            });

            page.Content().PaddingTop(18).Column(content =>
            {
                content.Item().Row(row =>
                {
                    SummaryMetric(row.RelativeItem(), "TOTAL ORDERS", orders.Count.ToString("N0", IndianCulture));
                    SummaryMetric(row.RelativeItem(), "SALES ORDERS", salesOrders.Count.ToString("N0", IndianCulture));
                    SummaryMetric(row.RelativeItem(), "CANCELLED", orders.Count(order => order.Status == OrderStatus.Cancelled).ToString("N0", IndianCulture));
                    SummaryMetric(row.RelativeItem(), "SALES REVENUE", Money(salesRevenue));
                });

                content.Item().PaddingTop(12).Text($"Average sales order: {Money(averageOrder)}")
                    .FontSize(10).Bold().FontColor("#D9381E");
                content.Item().PaddingTop(20).Text("ORDER DETAILS").FontSize(13).Bold();
                content.Item().PaddingTop(8).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(42);
                        columns.RelativeColumn(1.5f);
                        columns.RelativeColumn(2.4f);
                        columns.RelativeColumn(1.3f);
                        columns.RelativeColumn(1.2f);
                        columns.RelativeColumn(1.2f);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(HeaderCell).Text("Order");
                        header.Cell().Element(HeaderCell).Text("Date");
                        header.Cell().Element(HeaderCell).Text("Customer");
                        header.Cell().Element(HeaderCell).Text("Status");
                        header.Cell().Element(HeaderCell).Text("Payment");
                        header.Cell().Element(HeaderCell).AlignRight().Text("Amount");
                    });

                    foreach (var order in orders.OrderByDescending(order => order.OrderDate))
                    {
                        table.Cell().Element(BodyCell).Text($"#{order.Id}");
                        table.Cell().Element(BodyCell).Text(ToIndiaTime(order.OrderDate).ToString("dd MMM yy", IndianCulture));
                        table.Cell().Element(BodyCell).Text(order.User?.FullName ?? "Customer");
                        table.Cell().Element(BodyCell).Text(StatusLabel(order.Status));
                        table.Cell().Element(BodyCell).Text(order.PaymentMethod);
                        table.Cell().Element(BodyCell).AlignRight().Text(Money(order.TotalAmount));
                    }

                    if (orders.Count == 0)
                    {
                        table.Cell().ColumnSpan(6).Element(BodyCell).AlignCenter().Text("No orders in this period.").FontColor("#64748B");
                    }
                });
                content.Item().PaddingTop(12).AlignRight().Text($"Sales revenue (excluding cancelled orders): {Money(salesRevenue)}")
                    .Bold().FontSize(11).FontColor("#D9381E");
            });

            page.Footer().AlignCenter().DefaultTextStyle(style => style.FontSize(8).FontColor("#64748B")).Text(text =>
            {
                text.Span("FOODORDER  |  Generated ");
                text.Span(ToIndiaTime(DateTime.UtcNow).ToString("dd MMM yyyy, hh:mm tt", IndianCulture));
                text.Span("  |  Page ");
                text.CurrentPageNumber();
            });
        }));

        return document.GeneratePdf();
    }

    public static byte[] CreateExcel(IReadOnlyCollection<Order> orders, string period, DateOnly startDate, DateOnly endDate)
    {
        var salesOrders = orders.Where(order => order.Status != OrderStatus.Cancelled).ToList();
        var salesRevenue = salesOrders.Sum(order => order.TotalAmount);
        var averageOrder = salesOrders.Count == 0 ? 0 : salesRevenue / salesOrders.Count;
        using var workbook = new XLWorkbook();

        var summary = workbook.Worksheets.Add("Sales Summary");
        summary.Cell("A1").Value = "FOODORDER | SALES REPORT";
        summary.Range("A1:B1").Merge();
        summary.Cell("A1").Style.Font.Bold = true;
        summary.Cell("A1").Style.Font.FontSize = 18;
        summary.Cell("A1").Style.Font.FontColor = XLColor.FromHtml("#D9381E");
        summary.Cell("A2").Value = $"{TitleCase(period)} report: {startDate:dd MMM yyyy} - {endDate:dd MMM yyyy}";
        summary.Range("A2:B2").Merge();
        summary.Cell("A4").Value = "Metric";
        summary.Cell("B4").Value = "Value";
        summary.Range("A4:B4").Style.Font.Bold = true;
        summary.Range("A4:B4").Style.Fill.BackgroundColor = XLColor.FromHtml("#20242D");
        summary.Range("A4:B4").Style.Font.FontColor = XLColor.White;
        var metrics = new (string Name, object Value)[]
        {
            ("Total orders", orders.Count),
            ("Sales orders (excluding cancelled)", salesOrders.Count),
            ("Cancelled orders", orders.Count(order => order.Status == OrderStatus.Cancelled)),
            ("Sales revenue (INR)", salesRevenue),
            ("Average sales order (INR)", averageOrder)
        };
        for (var index = 0; index < metrics.Length; index++)
        {
            var row = index + 5;
            summary.Cell(row, 1).Value = metrics[index].Name;
            if (metrics[index].Value is int count)
                summary.Cell(row, 2).Value = count;
            else
                summary.Cell(row, 2).Value = (decimal)metrics[index].Value;
        }
        summary.Column(1).Width = 38;
        summary.Column(2).Width = 22;
        summary.Range("B8:B9").Style.NumberFormat.Format = "\"₹\"#,##0.00";
        summary.SheetView.FreezeRows(4);

        var detail = workbook.Worksheets.Add("Order Details");
        var headers = new[] { "Order ID", "Order Date (IST)", "Customer", "Email", "Status", "Payment Method", "Items", "Order Amount (INR)" };
        for (var column = 0; column < headers.Length; column++)
        {
            detail.Cell(1, column + 1).Value = headers[column];
        }
        detail.Range(1, 1, 1, headers.Length).Style.Font.Bold = true;
        detail.Range(1, 1, 1, headers.Length).Style.Font.FontColor = XLColor.White;
        detail.Range(1, 1, 1, headers.Length).Style.Fill.BackgroundColor = XLColor.FromHtml("#20242D");

        var sortedOrders = orders.OrderByDescending(order => order.OrderDate).ToList();
        for (var index = 0; index < sortedOrders.Count; index++)
        {
            var order = sortedOrders[index];
            var row = index + 2;
            detail.Cell(row, 1).Value = order.Id;
            detail.Cell(row, 2).Value = ToIndiaTime(order.OrderDate);
            detail.Cell(row, 2).Style.DateFormat.Format = "dd mmm yyyy hh:mm AM/PM";
            detail.Cell(row, 3).Value = order.User?.FullName ?? "Customer";
            detail.Cell(row, 4).Value = order.User?.Email ?? string.Empty;
            detail.Cell(row, 5).Value = StatusLabel(order.Status);
            detail.Cell(row, 6).Value = order.PaymentMethod;
            detail.Cell(row, 7).Value = string.Join(", ", order.OrderItems.Select(item => $"{item.Food?.Name ?? $"Food #{item.FoodId}"} x {item.Quantity}"));
            detail.Cell(row, 8).Value = order.TotalAmount;
        }
        detail.Column(1).Width = 12;
        detail.Column(2).Width = 22;
        detail.Column(3).Width = 24;
        detail.Column(4).Width = 32;
        detail.Column(5).Width = 20;
        detail.Column(6).Width = 20;
        detail.Column(7).Width = 55;
        detail.Column(8).Width = 22;
        if (sortedOrders.Count > 0)
        {
            detail.Range(2, 8, sortedOrders.Count + 1, 8).Style.NumberFormat.Format = "\"₹\"#,##0.00";
            detail.Range(1, 1, sortedOrders.Count + 1, headers.Length).SetAutoFilter();
        }
        detail.SheetView.FreezeRows(1);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void SummaryMetric(IContainer container, string label, string value)
    {
        container.Border(1).BorderColor("#E2E8F0").Background("#F8FAFC").Padding(10).Column(column =>
        {
            column.Item().Text(label).FontSize(7).Bold().FontColor("#64748B");
            column.Item().PaddingTop(4).Text(value).FontSize(11).Bold().FontColor("#20242D");
        });
    }

    private static IContainer HeaderCell(IContainer container) => container
        .Background("#20242D").PaddingVertical(8).PaddingHorizontal(5)
        .DefaultTextStyle(style => style.Bold().FontColor(Colors.White).FontSize(7));

    private static IContainer BodyCell(IContainer container) => container
        .BorderBottom(1).BorderColor("#E2E8F0").PaddingVertical(7).PaddingHorizontal(5)
        .DefaultTextStyle(style => style.FontSize(7));

    private static string Money(decimal amount) => $"₹{amount.ToString("N2", IndianCulture)}";
    private static string TitleCase(string value) => CultureInfo.InvariantCulture.TextInfo.ToTitleCase(value.ToLowerInvariant());
    private static string StatusLabel(OrderStatus status) => status == OrderStatus.OutForDelivery ? "Out for delivery" : status.ToString();

    private static DateTime ToIndiaTime(DateTime value)
    {
        var utcValue = value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
        return utcValue.Add(IndiaOffset);
    }
}
