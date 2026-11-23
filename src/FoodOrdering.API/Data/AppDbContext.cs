using FoodOrdering.API.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FoodOrdering.API.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Category> Categories { get; set; }
        public DbSet<Food> Foods { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Invoice> Invoices { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Precision configurations
            builder.Entity<Food>()
                .Property(f => f.Price)
                .HasPrecision(18, 2);

            builder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasPrecision(18, 2);

            builder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice)
                .HasPrecision(18, 2);

            builder.Entity<Invoice>()
                .Property(i => i.SubTotal)
                .HasPrecision(18, 2);

            builder.Entity<Invoice>()
                .Property(i => i.Tax)
                .HasPrecision(18, 2);

            builder.Entity<Invoice>()
                .Property(i => i.GrandTotal)
                .HasPrecision(18, 2);

            // Relationships
            builder.Entity<Order>()
                .HasOne(o => o.Invoice)
                .WithOne(i => i.Order)
                .HasForeignKey<Invoice>(i => i.OrderId);

            builder.Entity<Order>()
                .HasMany(o => o.OrderItems)
                .WithOne(oi => oi.Order)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Category>()
                .HasMany(c => c.Foods)
                .WithOne(f => f.Category)
                .HasForeignKey(f => f.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<CartItem>()
                .HasOne(ci => ci.Food)
                .WithMany()
                .HasForeignKey(ci => ci.FoodId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            builder.Entity<Food>()
                .HasIndex(f => f.Name);

            builder.Entity<CartItem>()
                .HasIndex(ci => ci.UserId);

            builder.Entity<Order>()
                .HasIndex(o => o.UserId);

            builder.Entity<Order>()
                .HasIndex(o => o.PaymentReference)
                .IsUnique()
                .HasFilter("[PaymentReference] IS NOT NULL");

            builder.Entity<Invoice>()
                .HasIndex(i => i.InvoiceNumber)
                .IsUnique();

            // Seed roles
            builder.Entity<IdentityRole>().HasData(
                new IdentityRole
                {
                    Id = "1",
                    Name = "Admin",
                    NormalizedName = "ADMIN",
                    ConcurrencyStamp = "admin-role-stamp"
                },
                new IdentityRole
                {
                    Id = "2",
                    Name = "Customer",
                    NormalizedName = "CUSTOMER",
                    ConcurrencyStamp = "customer-role-stamp"
                }
            );
        }
    }
}
