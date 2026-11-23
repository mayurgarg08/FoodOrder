using FoodOrdering.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodOrdering.API.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261123000000_AddRazorpayPaymentFields")]
    public partial class AddRazorpayPaymentFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "Orders",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "CashOnDelivery");

            migrationBuilder.AddColumn<string>(
                name: "PaymentReference",
                table: "Orders",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_PaymentReference",
                table: "Orders",
                column: "PaymentReference",
                unique: true,
                filter: "[PaymentReference] IS NOT NULL");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_PaymentReference",
                table: "Orders");

            migrationBuilder.DropColumn(name: "PaymentMethod", table: "Orders");
            migrationBuilder.DropColumn(name: "PaymentReference", table: "Orders");
        }
    }
}
