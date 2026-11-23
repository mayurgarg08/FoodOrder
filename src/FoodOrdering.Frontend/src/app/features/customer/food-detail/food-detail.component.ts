import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FoodService } from '../../../core/services/food.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { Food } from '../../../shared/models/food.model';

@Component({
  selector: 'app-food-detail',
  template: `
    <div class="container animate-fade-in" *ngIf="food">
      <div class="row py-5">
        <div class="col-md-6 mb-4">
          <div class="card-custom overflow-hidden">
            <img [src]="food.imageUrl | imageUrl" class="w-100" [alt]="food.name" style="height:400px;object-fit:cover" (error)="onImageError($event)">
          </div>
        </div>
        <div class="col-md-6">
          <span class="badge badge-status badge-confirmed mb-3">{{ food.categoryName }}</span>
          <h1 class="fw-bold mb-3">{{ food.name }}</h1>
          <p class="text-muted mb-4">{{ food.description }}</p>
          <h2 class="text-orange fw-bold mb-4">{{ food.price | currency:'INR':'symbol':'1.0-0':'en-IN' }}</h2>
          <div class="d-flex align-items-center gap-3 mb-4">
            <div class="input-group quantity-stepper" style="width:140px">
              <button class="btn btn-outline-custom" (click)="quantity > 1 ? quantity = quantity - 1 : null">−</button>
              <span class="quantity-value" aria-live="polite">{{ quantity }}</span>
              <button class="btn btn-outline-custom" (click)="quantity = quantity + 1">+</button>
            </div>
          </div>
          <button class="btn btn-primary-custom btn-lg" (click)="addToCart()">
            <i class="bi bi-cart-plus me-2"></i>Add to Cart
          </button>
        </div>
      </div>
    </div>
    <app-spinner [isLoading]="isLoading"></app-spinner>
  `,
  styles: [`
    .text-orange { color: var(--primary); }
    .quantity-stepper { display: inline-flex; flex-wrap: nowrap; align-items: center; gap: 5px; width: max-content !important; }
    .quantity-stepper .btn {
      flex: 0 0 34px; width: 34px; height: 34px; padding: 0; border: 0;
      border-radius: 9px !important; background: var(--gradient-primary); color: #fff;
      font-size: 0.95rem; font-weight: 800; line-height: 1; box-shadow: var(--shadow-sm);
    }
    .quantity-stepper .btn:hover { color: #fff; }
    .quantity-stepper .quantity-value {
      display: grid; place-items: center; flex: 0 0 36px; width: 36px; height: 34px;
      border: 1px solid var(--border-color); border-radius: 9px; color: var(--text-primary);
      background: var(--bg-dark); font-size: 0.9rem; font-weight: 700; line-height: 1;
    }
  `]
})
export class FoodDetailComponent implements OnInit {
  food: Food | null = null;
  quantity = 1;
  isLoading = false;

  constructor(private route: ActivatedRoute, private foodService: FoodService, private cartService: CartService, private toastr: ToastrService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.isLoading = true;
    this.foodService.getById(id).subscribe({
      next: (food) => { this.food = food; this.isLoading = false; },
      error: () => { this.isLoading = false; this.toastr.error('Food item not found.'); }
    });
  }

  addToCart(): void {
    if (!this.food) return;
    this.cartService.addToCart(this.food.id, this.quantity).subscribe({
      next: () => { this.toastr.success(`${this.food!.name} added to cart!`); this.cartService.refreshCartCount(); },
      error: () => this.toastr.error('Failed to add to cart.')
    });
  }

  onImageError(event: any): void {
    event.target.src = 'https://placehold.co/600x400/121212/D9381E?text=No+Image';
  }
}
