using FoodOrdering.API.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FoodOrdering.API.Data
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
            var db = services.GetRequiredService<AppDbContext>();

            // Ensure roles exist
            if (!await roleManager.RoleExistsAsync("Admin"))
            {
                await roleManager.CreateAsync(new IdentityRole("Admin"));
            }
            if (!await roleManager.RoleExistsAsync("Customer"))
            {
                await roleManager.CreateAsync(new IdentityRole("Customer"));
            }

            // Seed Admin User
            if (!await userManager.Users.AnyAsync(u => u.Email == "admin@foodapp.com"))
            {
                var admin = new ApplicationUser
                {
                    UserName = "admin@foodapp.com",
                    Email = "admin@foodapp.com",
                    FullName = "System Admin",
                    Address = "123 Admin Street, Food City",
                    EmailConfirmed = true
                };
                var result = await userManager.CreateAsync(admin, "Admin@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(admin, "Admin");
                }
            }

            // Seed a demo customer
            if (!await userManager.Users.AnyAsync(u => u.Email == "customer@foodapp.com"))
            {
                var customer = new ApplicationUser
                {
                    UserName = "customer@foodapp.com",
                    Email = "customer@foodapp.com",
                    FullName = "Demo Customer",
                    Address = "456 Customer Lane, Food City",
                    EmailConfirmed = true
                };
                var result = await userManager.CreateAsync(customer, "Customer@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(customer, "Customer");
                }
            }

            // Seed Categories
            if (!db.Categories.Any())
            {
                var categories = new List<Category>
                {
                    new Category
                    {
                        Name = "Burgers",
                        Description = "Juicy, flame-grilled burgers with premium toppings",
                        ImageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80",
                        IsActive = true
                    },
                    new Category
                    {
                        Name = "Pizza",
                        Description = "Wood-fired artisan pizzas with fresh ingredients",
                        ImageUrl = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
                        IsActive = true
                    },
                    new Category
                    {
                        Name = "Drinks",
                        Description = "Refreshing beverages and craft cocktails",
                        ImageUrl = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
                        IsActive = true
                    },
                    new Category
                    {
                        Name = "Desserts",
                        Description = "Sweet treats and decadent desserts",
                        ImageUrl = "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=500&q=80",
                        IsActive = true
                    },
                    new Category
                    {
                        Name = "Salads",
                        Description = "Fresh and healthy salad bowls, packed with goodness",
                        ImageUrl = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80",
                        IsActive = true
                    }
                };
                db.Categories.AddRange(categories);
                await db.SaveChangesAsync();
            }

            // Keep the seeded Salads description in sync for databases that were seeded earlier.
            var saladsCategory = await db.Categories.FirstOrDefaultAsync(c => c.Name == "Salads");
            const string saladsDescription = "Fresh and healthy salad bowls, packed with goodness";
            if (saladsCategory != null && saladsCategory.Description != saladsDescription)
            {
                saladsCategory.Description = saladsDescription;
                await db.SaveChangesAsync();
            }

            // Seed Food Items
            if (!db.Foods.Any())
            {
                var burgerCat = await db.Categories.FirstAsync(c => c.Name == "Burgers");
                var pizzaCat = await db.Categories.FirstAsync(c => c.Name == "Pizza");
                var drinksCat = await db.Categories.FirstAsync(c => c.Name == "Drinks");
                var dessertsCat = await db.Categories.FirstAsync(c => c.Name == "Desserts");
                var saladsCat = await db.Categories.FirstAsync(c => c.Name == "Salads");

                var foods = new List<Food>
                {
                    // Burgers
                    new Food { Name = "Classic Cheeseburger", Description = "Angus beef patty with cheddar cheese, lettuce, tomato, and our special sauce", Price = 179m, CategoryId = burgerCat.Id, ImageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                    new Food { Name = "BBQ Bacon Burger", Description = "Smoky BBQ sauce, crispy bacon, onion rings, and melted gouda", Price = 229m, CategoryId = burgerCat.Id, ImageUrl = "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                    new Food { Name = "Mushroom Swiss Burger", Description = "Sautéed mushrooms and Swiss cheese on a brioche bun", Price = 199m, CategoryId = burgerCat.Id, ImageUrl = "https://images.unsplash.com/photo-1594212644265-2fb0d7a68ea6?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                    new Food { Name = "Spicy Jalapeno Burger", Description = "Pepper jack cheese, fresh jalapenos, and spicy mayo", Price = 189m, CategoryId = burgerCat.Id, ImageUrl = "https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&w=500&q=80", IsAvailable = true },

                    // Pizza
                    new Food { Name = "Margherita Pizza", Description = "San Marzano tomatoes, fresh mozzarella, basil, and extra virgin olive oil", Price = 199m, CategoryId = pizzaCat.Id, ImageUrl = "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                    new Food { Name = "Pepperoni Supreme", Description = "Double pepperoni, mozzarella, and oregano on a crispy thin crust", Price = 299m, CategoryId = pizzaCat.Id, ImageUrl = "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                    new Food { Name = "Veggie Garden Pizza", Description = "Bell peppers, mushrooms, olives, onions, and artichoke hearts", Price = 249m, CategoryId = pizzaCat.Id, ImageUrl = "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                    new Food { Name = "Hawaiian Pizza", Description = "Fresh pineapple, smoked ham, and mozzarella", Price = 279m, CategoryId = pizzaCat.Id, ImageUrl = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80", IsAvailable = true },

                    // Drinks
                    new Food { Name = "Fresh Lemonade", Description = "Freshly squeezed lemons with a hint of mint", Price = 79m, CategoryId = drinksCat.Id, ImageUrl = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                    new Food { Name = "Mango Smoothie", Description = "Blended mango, yogurt, and honey", Price = 129m, CategoryId = drinksCat.Id, ImageUrl = "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                    new Food { Name = "Iced Coffee", Description = "Cold brew coffee with vanilla syrup and cream", Price = 119m, CategoryId = drinksCat.Id, ImageUrl = "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                    new Food { Name = "Strawberry Milkshake", Description = "Creamy strawberry blend topped with whipped cream", Price = 139m, CategoryId = drinksCat.Id, ImageUrl = "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80", IsAvailable = true },

                    // Desserts
                    new Food { Name = "Chocolate Lava Cake", Description = "Warm chocolate cake with a molten center, served with vanilla ice cream", Price = 149m, CategoryId = dessertsCat.Id, ImageUrl = "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                    new Food { Name = "Tiramisu", Description = "Classic Italian dessert with espresso-soaked ladyfingers and mascarpone", Price = 179m, CategoryId = dessertsCat.Id, ImageUrl = "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                    new Food { Name = "Cheesecake", Description = "New York style cheesecake with a graham cracker crust and berry compote", Price = 169m, CategoryId = dessertsCat.Id, ImageUrl = "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=500&q=80", IsAvailable = true },

                    // Salads
                    new Food { Name = "Caesar Salad", Description = "Romaine lettuce, parmesan, croutons, and house-made Caesar dressing", Price = 169m, CategoryId = saladsCat.Id, ImageUrl = "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                    new Food { Name = "Greek Salad", Description = "Cucumber, tomatoes, olives, feta cheese, and oregano vinaigrette", Price = 149m, CategoryId = saladsCat.Id, ImageUrl = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                };
                db.Foods.AddRange(foods);
                await db.SaveChangesAsync();
            }

            // Add new menu items to existing databases without duplicating them on restart.
            var burgerCategoryId = await db.Categories.Where(c => c.Name == "Burgers").Select(c => c.Id).FirstAsync();
            var pizzaCategoryId = await db.Categories.Where(c => c.Name == "Pizza").Select(c => c.Id).FirstAsync();
            var drinksCategoryId = await db.Categories.Where(c => c.Name == "Drinks").Select(c => c.Id).FirstAsync();
            var dessertCategoryId = await db.Categories.Where(c => c.Name == "Desserts").Select(c => c.Id).FirstAsync();
            var saladCategoryId = await db.Categories.Where(c => c.Name == "Salads").Select(c => c.Id).FirstAsync();

            var additionalFoods = new List<Food>
            {
                new Food { Name = "Crispy Chicken Burger", Description = "Crispy chicken breast with lettuce, pickles, and creamy garlic sauce", Price = 179m, CategoryId = burgerCategoryId, ImageUrl = "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                new Food { Name = "Double Smash Burger", Description = "Two seared beef patties with American cheese and caramelized onions", Price = 249m, CategoryId = burgerCategoryId, ImageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                new Food { Name = "Four Cheese Pizza", Description = "Mozzarella, parmesan, provolone, and gorgonzola on a crisp crust", Price = 329m, CategoryId = pizzaCategoryId, ImageUrl = "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                new Food { Name = "Spicy Chicken Pizza", Description = "Grilled chicken, jalapenos, red onion, and spicy tomato sauce", Price = 299m, CategoryId = pizzaCategoryId, ImageUrl = "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                new Food { Name = "Classic Cola", Description = "Chilled sparkling cola served over ice", Price = 49m, CategoryId = drinksCategoryId, ImageUrl = "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                new Food { Name = "Iced Matcha Latte", Description = "Earthy matcha whisked with milk and poured over ice", Price = 149m, CategoryId = drinksCategoryId, ImageUrl = "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                new Food { Name = "Blueberry Muffin", Description = "Soft baked muffin filled with blueberries and a golden crumb top", Price = 89m, CategoryId = dessertCategoryId, ImageUrl = "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                new Food { Name = "Vanilla Bean Panna Cotta", Description = "Silky vanilla bean cream topped with seasonal berry sauce", Price = 159m, CategoryId = dessertCategoryId, ImageUrl = "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                new Food { Name = "Quinoa Avocado Bowl", Description = "Quinoa, ripe avocado, cherry tomatoes, cucumber, and lemon dressing", Price = 199m, CategoryId = saladCategoryId, ImageUrl = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80", IsAvailable = true },
                new Food { Name = "Grilled Chicken Salad", Description = "Grilled chicken, mixed greens, tomatoes, and honey mustard dressing", Price = 229m, CategoryId = saladCategoryId, ImageUrl = "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=500&q=80", IsAvailable = true }
            };

            var existingFoodNames = await db.Foods.Select(food => food.Name).ToListAsync();
            var newFoods = additionalFoods
                .Where(food => !existingFoodNames.Contains(food.Name, StringComparer.OrdinalIgnoreCase))
                .ToList();
            if (newFoods.Count > 0)
            {
                db.Foods.AddRange(newFoods);
                await db.SaveChangesAsync();
            }

            var rupeeMenuPrices = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
            {
                ["Classic Cheeseburger"] = 179m,
                ["BBQ Bacon Burger"] = 229m,
                ["Mushroom Swiss Burger"] = 199m,
                ["Spicy Jalapeno Burger"] = 189m,
                ["Crispy Chicken Burger"] = 179m,
                ["Double Smash Burger"] = 249m,
                ["Margherita Pizza"] = 199m,
                ["Pepperoni Supreme"] = 299m,
                ["Veggie Garden Pizza"] = 249m,
                ["Hawaiian Pizza"] = 279m,
                ["Four Cheese Pizza"] = 329m,
                ["Spicy Chicken Pizza"] = 299m,
                ["Fresh Lemonade"] = 79m,
                ["Mango Smoothie"] = 129m,
                ["Iced Coffee"] = 119m,
                ["Strawberry Milkshake"] = 139m,
                ["Classic Cola"] = 49m,
                ["Iced Matcha Latte"] = 149m,
                ["Chocolate Lava Cake"] = 149m,
                ["Tiramisu"] = 179m,
                ["Cheesecake"] = 169m,
                ["Blueberry Muffin"] = 89m,
                ["Vanilla Bean Panna Cotta"] = 159m,
                ["Caesar Salad"] = 169m,
                ["Greek Salad"] = 149m,
                ["Quinoa Avocado Bowl"] = 199m,
                ["Grilled Chicken Salad"] = 229m
            };

            var seededFoodNames = rupeeMenuPrices.Keys.ToArray();
            var seededFoodsInDatabase = await db.Foods
                .Where(food => seededFoodNames.Contains(food.Name))
                .ToListAsync();
            var pricesChanged = false;
            foreach (var food in seededFoodsInDatabase)
            {
                if (rupeeMenuPrices.TryGetValue(food.Name, out var price) && food.Price != price)
                {
                    food.Price = price;
                    pricesChanged = true;
                }
            }

            if (pricesChanged)
            {
                await db.SaveChangesAsync();
            }
        }
    }
}
