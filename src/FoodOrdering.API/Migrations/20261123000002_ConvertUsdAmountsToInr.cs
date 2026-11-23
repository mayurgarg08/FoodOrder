using FoodOrdering.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace FoodOrdering.API.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261123000002_ConvertUsdAmountsToInr")]
    public partial class ConvertUsdAmountsToInr : Migration
    {
        private const string UsdToInrRate = "92.68";

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($"""
                UPDATE [Foods]
                SET [Price] = ROUND([Price] * {UsdToInrRate}, 0);

                UPDATE [OrderItems]
                SET [UnitPrice] = ROUND([UnitPrice] * {UsdToInrRate}, 0);

                UPDATE [Orders]
                SET [TotalAmount] = ROUND([TotalAmount] * {UsdToInrRate}, 0);

                UPDATE [Invoices]
                SET [SubTotal] = ROUND([SubTotal] * {UsdToInrRate}, 0),
                    [Tax] = ROUND([Tax] * {UsdToInrRate}, 0),
                    [GrandTotal] = ROUND([GrandTotal] * {UsdToInrRate}, 0);
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($"""
                UPDATE [Foods]
                SET [Price] = ROUND([Price] / {UsdToInrRate}, 2);

                UPDATE [OrderItems]
                SET [UnitPrice] = ROUND([UnitPrice] / {UsdToInrRate}, 2);

                UPDATE [Orders]
                SET [TotalAmount] = ROUND([TotalAmount] / {UsdToInrRate}, 2);

                UPDATE [Invoices]
                SET [SubTotal] = ROUND([SubTotal] / {UsdToInrRate}, 2),
                    [Tax] = ROUND([Tax] / {UsdToInrRate}, 2),
                    [GrandTotal] = ROUND([GrandTotal] / {UsdToInrRate}, 2);
                """);
        }
    }
}
