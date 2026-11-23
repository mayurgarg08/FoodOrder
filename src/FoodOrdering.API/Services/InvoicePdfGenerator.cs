
using System.Globalization;
using FoodOrdering.API.Models.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FoodOrdering.API.Services
{
    internal static class InvoicePdfGenerator
    {
        public static byte[] Create(Order order)
        {
            var invoice = order.Invoice
                ?? throw new InvalidOperationException("Invoice not found.");

            QuestPDF.Settings.License = LicenseType.Community;

            var currency = new CultureInfo("en-IN");

            string Money(decimal amount) =>
                "₹" + amount.ToString("N0", currency);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(35);
                    page.DefaultTextStyle(x =>
    x.FontFamily("Lato").FontSize(9).FontColor("#263238"));

                    // HEADER
                    page.Header().Column(header =>
                    {
                        header.Item().Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("FOOD")
                                    .FontSize(25)
                                    .Bold()
                                    .FontColor("#E23744");

                                col.Item().Text("ORDER")
                                    .FontSize(13)
                                    .Bold()
                                    .FontColor("#263238");

                                col.Item().PaddingTop(4)
                                    .Text("ONLINE FOOD ORDERING")
                                    .FontSize(8)
                                    .FontColor("#718096");
                            });

                            row.RelativeItem().AlignRight().Column(col =>
                            {
                                col.Item().Text("TAX INVOICE")
                                    .FontSize(20)
                                    .Bold()
                                    .FontColor("#263238");

                                col.Item().PaddingTop(5)
                                    .Text($"Invoice No: {invoice.InvoiceNumber}")
                                    .FontSize(9);

                                col.Item().Text($"Order ID: #{order.Id}")
                                    .FontSize(9);

                                col.Item().Text(
                                    $"Date: {order.OrderDate:dd MMM yyyy, hh:mm tt}")
                                    .FontSize(9);
                            });
                        });

                        header.Item().PaddingTop(18)
                            .LineHorizontal(2)
                            .LineColor("#E23744");
                    });

                    // BODY
                    page.Content().PaddingTop(20).Column(column =>
                    {
                        // CUSTOMER INFORMATION
                        column.Item().Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("BILL TO")
                                    .FontSize(9)
                                    .Bold()
                                    .FontColor("#E23744");

                                col.Item().PaddingTop(8)
                                    .Text(order.User?.FullName ?? "Customer")
                                    .FontSize(12)
                                    .Bold();

                                col.Item().PaddingTop(3)
                                    .Text(order.User?.Email ?? "")
                                    .FontColor("#64748B");

                                col.Item().PaddingTop(5)
                                    .Text("Delivery Address")
                                    .Bold();

                                col.Item().PaddingTop(3)
                                    .Text(order.DeliveryAddress ?? "Not provided")
                                    .FontColor("#64748B");
                            });
                        });

                        column.Item().PaddingTop(25)
                            .Text("ORDER SUMMARY")
                            .FontSize(13)
                            .Bold()
                            .FontColor("#263238");

                        column.Item().PaddingTop(12).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(4);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                            });

                            // TABLE HEADER
                            table.Header(header =>
                            {
                                header.Cell().Element(HeaderCell).Text("Qty");
                                header.Cell().Element(HeaderCell).Text("Item Description");
                                header.Cell().Element(HeaderCell)
                                    .AlignRight().Text("Unit Price");
                                header.Cell().Element(HeaderCell)
                                    .AlignRight().Text("Amount");
                            });

                            // ORDER ITEMS
                            foreach (var item in order.OrderItems)
                            {
                                var name = item.Food?.Name
                                    ?? $"Food item #{item.FoodId}";

                                table.Cell().Element(BodyCell)
                                    .Text(item.Quantity.ToString());

                                table.Cell().Element(BodyCell)
                                    .Text(name).SemiBold();

                                table.Cell().Element(BodyCell)
                                    .AlignRight()
                                    .Text(Money(item.UnitPrice));

                                table.Cell().Element(BodyCell)
                                    .AlignRight()
                                    .Text(Money(item.UnitPrice * item.Quantity))
                                    .SemiBold();
                            }
                        });

                        // BILLING SUMMARY
                        column.Item().PaddingTop(25).AlignRight()
                            .Width(245).Column(totals =>
                            {
                                totals.Item().Row(row =>
                                {
                                    row.RelativeItem().Text("Subtotal");
                                    row.ConstantItem(100).AlignRight()
                                        .Text(Money(invoice.SubTotal));
                                });

                                totals.Item().PaddingTop(10).Row(row =>
                                {
                                    row.RelativeItem().Text("Tax");
                                    row.ConstantItem(100).AlignRight()
                                        .Text(Money(invoice.Tax));
                                });

                                totals.Item().PaddingTop(12)
                                    .LineHorizontal(1)
                                    .LineColor("#CBD5E1");

                                totals.Item().PaddingTop(12)
                                    .Background("#FFF1F2")
                                    .Padding(12).Row(row =>
                                    {
                                        row.RelativeItem().Text("GRAND TOTAL")
                                            .Bold()
                                            .FontSize(12)
                                            .FontColor("#E23744");

                                        row.ConstantItem(115).AlignRight()
                                            .Text(Money(invoice.GrandTotal))
                                            .Bold()
                                            .FontSize(14)
                                            .FontColor("#E23744");
                                    });
                            });

                        // FOOTER MESSAGE
                        column.Item().PaddingTop(45)
                            .LineHorizontal(1)
                            .LineColor("#E2E8F0");

                        column.Item().PaddingTop(15)
                            .AlignCenter()
                            .Text("Thank you for ordering with FOODORDER!")
                            .Bold()
                            .FontSize(12)
                            .FontColor("#263238");

                        column.Item().PaddingTop(5)
                            .AlignCenter()
                            .Text("We appreciate your order and hope to serve you again.")
                            .FontSize(9)
                            .FontColor("#64748B");
                    });

                    // PAGE FOOTER
                    page.Footer().Column(footer =>
                    {
                        footer.Item().LineHorizontal(1)
                            .LineColor("#E2E8F0");

                        footer.Item().PaddingTop(8).Row(row =>
                        {
                            row.RelativeItem()
                                .Text("FOODORDER | Computer-generated invoice")
                                .FontSize(8)
                                .FontColor("#94A3B8");

                            row.RelativeItem().AlignRight()
                                .Text(text =>
                                {
                                    text.Span("Page ").FontSize(8);
                                    text.CurrentPageNumber().FontSize(8);
                                    text.Span(" of ").FontSize(8);
                                    text.TotalPages().FontSize(8);
                                });
                        });
                    });
                });
            });

            return document.GeneratePdf();
        }

        private static IContainer HeaderCell(IContainer container)
        {
            return container
                .Background("#263238")
                .PaddingVertical(11)
                .PaddingHorizontal(8)
                .DefaultTextStyle(x => x
                    .Bold()
                    .FontColor("#FFFFFF")
                    .FontSize(9));
        }

        private static IContainer BodyCell(IContainer container)
        {
            return container
                .BorderBottom(1)
                .BorderColor("#E2E8F0")
                .PaddingVertical(12)
                .PaddingHorizontal(8);
        }
    }
}
