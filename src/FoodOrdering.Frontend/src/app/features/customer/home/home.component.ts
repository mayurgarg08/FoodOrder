import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FoodService } from '../../../core/services/food.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Food, Category } from '../../../shared/models/food.model';

@Component({
  selector: 'app-home',
  template: `
    <div class="container animate-fade-in">
      <section class="hero-section mb-5">
        <div class="hero-copy">
          <span class="hero-eyebrow"><i class="bi bi-fire me-2"></i>GOOD FOOD, RIGHT ON TIME</span>
          <h1>Make room for<br><span class="text-gradient">something delicious.</span></h1>
          <p>Find a new favorite, order in a few clicks, and enjoy it at home.</p>
          <a routerLink="/foods" class="btn btn-primary-custom btn-lg">
            <i class="bi bi-grid me-2"></i>Explore the menu
          </a>
        </div>
        <div class="hero-visual" *ngIf="popularFoods.length">
          <div class="hero-orbit orbit-one"></div>
          <div class="hero-orbit orbit-two"></div>
          <div class="hero-food-card" role="link" tabindex="0" (click)="openFood(popularFoods[0])"
              (keydown.enter)="openFood(popularFoods[0])" [attr.aria-label]="'View ' + popularFoods[0].name + ' details'">
            <img [src]="popularFoods[0].imageUrl | imageUrl" [alt]="popularFoods[0].name" (error)="onImageError($event)">
            <div class="hero-food-caption">
              <span class="small text-muted">A menu favorite</span>
              <strong>{{ popularFoods[0].name }}</strong>
            </div>
          </div>
          <span class="hero-spark spark-one"><i class="bi bi-stars"></i></span>
          <span class="hero-spark spark-two"><i class="bi bi-heart-fill"></i></span>
        </div>
      </section>

      <section class="stats-strip mb-5" aria-label="Menu at a glance">
        <div class="stat-item">
          <i class="bi bi-basket2"></i>
          <div><strong>{{ totalFoodCount }}</strong><span>menu items</span></div>
        </div>
        <div class="stat-item">
          <i class="bi bi-grid"></i>
          <div><strong>{{ categories.length }}</strong><span>food categories</span></div>
        </div>
        <div class="stat-item">
          <i class="bi bi-credit-card"></i>
          <div><strong>2</strong><span>ways to pay</span></div>
        </div>
      </section>

      <section class="categories-section mb-5 mt-5" *ngIf="categories.length">
        <div class="section-heading mb-4">
          <span class="section-kicker">FIND YOUR CRAVING</span>
          <h2>Explore categories</h2>
        </div>
        <div class="row g-3">
          <div class="col-6 col-md-4 col-lg" *ngFor="let cat of categories">
            <div class="card-custom p-3 text-center category-card" (click)="browseCategory(cat.id)" style="cursor:pointer">
              <i class="bi bi-tag fs-3 text-orange"></i>
              <h6 class="mt-2 mb-0 fw-semibold">{{ cat.name }}</h6>
              <small class="text-muted">{{ cat.description }}</small>
            </div>
          </div>
        </div>
      </section>

      <section class="popular-section mb-5" *ngIf="popularFoods.length">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div class="section-heading">
            <span class="section-kicker">PICKED FOR YOU</span>
            <h2 class="mb-0"><i class="bi bi-star me-2"></i>Popular items</h2>
          </div>
          <a routerLink="/foods" class="btn btn-outline-custom btn-sm">View All</a>
        </div>
        <div class="row g-4">
          <div class="col-sm-6 col-md-4 col-lg-3" *ngFor="let food of popularFoods">
            <div class="card-custom food-card h-100" role="link" tabindex="0"
              (click)="openFood(food)" (keydown.enter)="openFood(food)" [attr.aria-label]="'View ' + food.name + ' details'">
              <div class="food-img-wrapper">
                <img [src]="food.imageUrl | imageUrl" class="card-img-top" [alt]="food.name" (error)="onImageError($event)">
                <span class="category-badge">{{ food.categoryName }}</span>
              </div>
              <div class="p-3">
                <h6 class="fw-bold mb-1">{{ food.name }}</h6>
                <p class="text-muted small mb-2 food-desc">{{ food.description }}</p>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="price fw-bold">{{ food.price | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
                  <button class="btn btn-sm btn-primary-custom" (click)="$event.stopPropagation(); addToCart(food)">
                    <i class="bi bi-cart-plus"></i> Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="cities-section mb-5">
        <div class="section-heading mb-4">
          <span class="section-kicker">YOUR NEXT MEAL IS CLOSE</span>
          <h2>Cities with food delivery</h2>
          <p class="text-muted mb-0">Explore the menu and find something you love.</p>
        </div>
        <div class="city-grid">
          <a class="city-card" routerLink="/foods" *ngFor="let city of visibleCities">
            <span>Order food online in {{ city }}</span>
            <i class="bi bi-arrow-up-right"></i>
          </a>
          <button type="button" class="city-card city-more" *ngIf="cities.length > 8" (click)="showAllCities = !showAllCities">
            <span>{{ showAllCities ? 'Show Less' : 'Show More' }}</span>
            <i class="bi" [ngClass]="showAllCities ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </button>
        </div>
      </section>

      <section class="presence-section mb-5">
        <div class="section-heading mb-4">
          <span class="section-kicker">FRESH FOOD, CLOSER TO YOU</span>
          <h2>Our Presence</h2>
          <p class="text-muted mb-0">We serve food lovers across India. Find FoodOrder on the map.</p>
        </div>
        <div class="presence-map">
          <iframe
            title="Map of India"
            src="https://maps.google.com/maps?q=India&z=5&output=embed"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen>
          </iframe>
          
        </div>
      </section>
    </div>
  `,
  styles: [`
    .hero-section {
      min-height: 400px; margin-top: 22px; padding: 52px clamp(24px, 6vw, 80px);
      border: 1px solid var(--border-color); border-radius: 28px; overflow: hidden;
      display: grid; grid-template-columns: 1.1fr 0.9fr; align-items: center;
      background: radial-gradient(circle at 78% 45%, rgba(217,56,30,0.16), transparent 32%),
        linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01));
    }
    .hero-copy { position: relative; z-index: 1; }
    .hero-eyebrow, .section-kicker { color: var(--primary); font-size: 0.76rem; font-weight: 800; letter-spacing: 0.14em; }
    .hero-copy h1 { margin: 18px 0; font-size: clamp(2.5rem, 5vw, 4.3rem); line-height: 1.08; font-weight: 850; letter-spacing: -0.055em; }
    .hero-copy p { max-width: 460px; color: var(--text-secondary); font-size: 1.15rem; margin-bottom: 28px; }
    .text-gradient {
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-visual { height: 390px; position: relative; display: grid; place-items: center; }
    .hero-orbit { position: absolute; border: 1px solid rgba(217,56,30,0.28); border-radius: 50%; transform: rotate(-18deg); }
    .orbit-one { width: 420px; height: 285px; }
    .orbit-two { width: 340px; height: 400px; transform: rotate(35deg); border-color: rgba(255,255,255,0.12); }
    .hero-food-card { position: relative; z-index: 1; width: min(390px, 92%); padding: 12px; border: 1px solid rgba(255,255,255,0.14); border-radius: 24px; background: rgba(18,18,18,0.88); box-shadow: 0 24px 70px rgba(0,0,0,0.4); transform: rotate(3deg); cursor: pointer; }
    .hero-food-card img { width: 100%; height: 270px; border-radius: 17px; object-fit: cover; }
    .hero-food-caption { display: flex; flex-direction: column; gap: 3px; padding: 12px 8px 5px; }
    .hero-spark { position: absolute; z-index: 2; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--bg-card); color: var(--primary); box-shadow: var(--shadow-lg); }
    .spark-one { top: 20px; right: 15%; font-size: 1.25rem; }
    .spark-two { bottom: 25px; left: 12%; font-size: 1rem; }
    .stats-strip { display: grid; grid-template-columns: repeat(3, 1fr); padding: 22px 12px; border: 1px solid var(--border-color); border-radius: 20px; background: var(--bg-card); }
    .stat-item { position: relative; display: flex; align-items: center; justify-content: center; gap: 15px; padding: 8px; }
    .stat-item + .stat-item { border-left: 1px solid var(--border-color); }
    .stat-item > i { position: absolute; left: 18%; color: var(--primary); font-size: 1.6rem; }
    .stat-item div { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .stat-item strong { font-size: 1.45rem; line-height: 1.2; }
    .stat-item span { color: var(--text-muted); font-size: 0.9rem; }
    .section-heading h2 { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; margin: 5px 0 8px; }
    .categories-section { margin-top: 0 !important; }
    .text-orange { color: var(--primary); }
    .category-card:hover { border-color: var(--primary); }
    .category-card { height: 100%; transition: var(--transition); }
    .food-card { transition: var(--transition); cursor: pointer; }
    .food-img-wrapper { position: relative; height: 180px; overflow: hidden; }
    .food-img-wrapper img { width: 100%; height: 100%; object-fit: cover; transition: var(--transition); }
    .food-card:hover img { transform: scale(1.05); }
    .category-badge {
      position: absolute; top: 10px; left: 10px;
      background: rgba(217,56,30,0.9); color: white;
      padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;
    }
    .food-desc { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .price { color: var(--primary); font-size: 1.1rem; }
    .city-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .city-card { min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 18px; border: 1px solid var(--border-color); border-radius: 14px; background: var(--bg-card); color: var(--text-primary); text-decoration: none; font-weight: 600; transition: var(--transition); }
    .city-card:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-2px); }
    .city-card i { color: var(--text-muted); }
    .city-more { justify-content: center; color: var(--primary); cursor: pointer; font: inherit; }
    .city-more i { color: var(--primary); }
    .presence-section { margin-top: 3rem; }
    .presence-map { position: relative; overflow: hidden; min-height: 340px; border: 1px solid var(--border-color); border-radius: 18px; background: var(--bg-card); box-shadow: var(--shadow-lg); }
    .presence-map iframe { display: block; width: 100%; height: 380px; border: 0; }
    .map-link { position: absolute; top: 14px; left: 14px; padding: 9px 13px; border: 1px solid var(--border-color); border-radius: 9px; background: var(--bg-card); color: var(--text-primary); text-decoration: none; font-weight: 600; box-shadow: var(--shadow-md); }
    .map-link:hover { color: var(--primary); border-color: var(--primary); }
    @media (max-width: 767.98px) {
      .hero-section { grid-template-columns: 1fr; padding: 36px 24px 20px; text-align: center; }
      .hero-copy p { margin-left: auto; margin-right: auto; }
      .hero-visual { height: 320px; }
      .hero-food-card { width: min(340px, 88%); }
      .hero-food-card img { height: 220px; }
      .stats-strip { grid-template-columns: 1fr; padding: 8px 18px; }
      .stat-item { justify-content: flex-start; padding: 14px 8px; }
      .stat-item + .stat-item { border-left: 0; border-top: 1px solid var(--border-color); }
      .city-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .city-card { min-height: 58px; padding: 12px; font-size: 0.88rem; }
      .presence-map, .presence-map iframe { min-height: 280px; height: 280px; }
    }
    @media (max-width: 420px) { .city-grid { grid-template-columns: 1fr; } }
  `]
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  popularFoods: Food[] = [];
  totalFoodCount = 0;
  showAllCities = false;
  cities = ['Bangalore', 'Gurgaon', 'Hyderabad', 'Delhi', 'Mumbai', 'Pune', 'Kolkata', 'Chennai', 'Ahmedabad', 'Chandigarh', 'Jaipur', 'Lucknow', 'Kochi', 'Indore', 'Bhopal', 'Coimbatore'];
  get visibleCities(): string[] { return this.showAllCities ? this.cities : this.cities.slice(0, 8); }

  constructor(
    private foodService: FoodService,
    private cartService: CartService,
    public authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.foodService.getCategories().subscribe(cats => this.categories = cats);
    this.foodService.getAll().subscribe(foods => {
      this.totalFoodCount = foods.length;
      this.popularFoods = foods.slice(0, 8);
    });
  }

  browseCategory(categoryId: number): void {
    this.router.navigate(['/foods'], { queryParams: { category: categoryId } });
  }

  openFood(food: Food): void {
    this.router.navigate(['/foods', food.id]);
  }

  addToCart(food: Food): void {
    this.cartService.addToCart(food.id, 1).subscribe({
      next: () => { this.toastr.success(`${food.name} added to cart!`); this.cartService.refreshCartCount(); },
      error: () => this.toastr.error('Failed to add item to cart.')
    });
  }

  onImageError(event: any): void {
    event.target.src = 'https://placehold.co/300x200/121212/D9381E?text=No+Image';
  }
}