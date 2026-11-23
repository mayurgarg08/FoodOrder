import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FoodService } from '../../../core/services/food.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { Food, Category } from '../../../shared/models/food.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-food-list',
  template: `
    <div class="container animate-fade-in">
      <div class="page-header">
        <h1><i class="bi bi-grid me-2"></i>Our Menu</h1>
      </div>
      <div class="row mb-4">
        <div class="col-md-3">
          <select class="form-select form-control-custom" [(ngModel)]="selectedCategory" (ngModelChange)="onCategoryChange()">
            <option [ngValue]="null">All Categories</option>
            <option *ngFor="let cat of categories" [ngValue]="cat.id">{{ cat.name }}</option>
          </select>
        </div>
      </div>
      <app-spinner [isLoading]="isLoading" message="Loading menu..."></app-spinner>
      <div *ngIf="!isLoading && foods.length === 0" class="empty-state">
        <i class="bi bi-search"></i>
        <h3>No food items found</h3>
        <p>Try adjusting your search or filter criteria.</p>
      </div>
      <div class="row g-4" *ngIf="!isLoading">
        <div class="col-sm-6 col-md-4 col-lg-3" *ngFor="let food of foods">
          <div class="card-custom food-card h-100" [routerLink]="['/foods', food.id]"
            role="link" tabindex="0" [attr.aria-label]="'View ' + food.name + ' details'">
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
    </div>
  `,
  styles: [`
    .food-img-wrapper { position: relative; height: 180px; overflow: hidden; }
    .food-img-wrapper img { width: 100%; height: 100%; object-fit: cover; transition: var(--transition); }
    .food-card { cursor: pointer; }
    .food-card:hover img { transform: scale(1.05); }
    .category-badge { position: absolute; top: 10px; left: 10px; background: rgba(217,56,30,0.9); color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .food-desc { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .price { color: var(--primary); font-size: 1.1rem; }
  `]
})
export class FoodListComponent implements OnInit {
  foods: Food[] = [];
  categories: Category[] = [];
  searchTerm = '';
  selectedCategory: number | null = null;
  isLoading = false;

  constructor(
    private foodService: FoodService,
    private cartService: CartService,
    private toastr: ToastrService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.foodService.getCategories().subscribe(cats => this.categories = cats);
    this.searchTerm = this.foodService.getMenuSearchTerm();
    this.foodService.menuSearchTerm$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => {
      this.searchTerm = term;
      this.loadFoods();
    });
    this.route.queryParams.subscribe(params => {
      if (params['search'] !== undefined) {
        this.searchTerm = params['search'];
        this.foodService.setMenuSearchTerm(this.searchTerm);
      }
      if (params['category']) {
        this.selectedCategory = +params['category'];
      }
      this.loadFoods();
    });
  }

  loadFoods(): void {
    this.isLoading = true;
    this.foodService.getAll(this.searchTerm || undefined, this.selectedCategory || undefined).subscribe({
      next: (foods) => { this.foods = foods; this.isLoading = false; },
      error: () => { this.isLoading = false; this.toastr.error('Failed to load menu.'); }
    });
  }

  onCategoryChange(): void { this.loadFoods(); }

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
