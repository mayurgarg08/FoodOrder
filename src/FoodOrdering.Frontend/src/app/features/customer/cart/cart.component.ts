import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { CartItem, CartResponse } from '../../../shared/models/user.model';

@Component({
  selector: 'app-cart',
  template: `
    <div class="container animate-fade-in">
      <div class="page-header">
        <h1><i class="bi bi-cart3 me-2"></i>Shopping Cart</h1>
      </div>
      <app-spinner [isLoading]="isLoading"></app-spinner>
      <div *ngIf="!isLoading && cart.items.length === 0" class="empty-state">
        <i class="bi bi-cart-x"></i>
        <h3>Your cart is empty</h3>
        <p>Browse our menu and add some delicious items!</p>
        <a routerLink="/foods" class="btn btn-primary-custom mt-3">Browse Menu</a>
      </div>
      <div *ngIf="!isLoading && cart.items.length > 0" class="row">
        <div class="col-lg-8 mb-4">
          <div class="card-custom">
            <div class="p-3" *ngFor="let item of cart.items; let i = index" [class.border-bottom]="i < cart.items.length - 1" style="border-color: var(--border-color) !important">
              <div class="d-flex align-items-center gap-3">
                <img [src]="item.foodImageUrl | imageUrl" class="rounded" style="width:80px;height:80px;object-fit:cover" [alt]="item.foodName" (error)="onImageError($event)">
                <div class="flex-grow-1">
                  <h6 class="fw-bold mb-1">{{ item.foodName }}</h6>
                  <span class="text-orange fw-semibold">{{ item.foodPrice | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <button class="btn btn-sm btn-outline-custom" (click)="updateQty(item, item.quantity - 1)">−</button>
                  <span class="fw-bold px-2">{{ item.quantity }}</span>
                  <button class="btn btn-sm btn-outline-custom" (click)="updateQty(item, item.quantity + 1)">+</button>
                </div>
                <span class="fw-bold text-orange" style="min-width:70px">{{ item.subTotal | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
                <button class="btn btn-sm text-danger" (click)="removeItem(item.id)"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card-custom p-4">
            <h5 class="fw-bold mb-3">Order Summary</h5>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Subtotal ({{ cart.totalItems }} items)</span>
                <span class="fw-semibold">{{ cart.totalAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Tax (10%)</span>
                <span class="fw-semibold">{{ taxAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
            </div>
            <hr style="border-color: var(--border-color);">
            <div class="d-flex justify-content-between mb-4">
              <span class="fw-bold fs-5">Total</span>
                <span class="fw-bold fs-5 text-orange">{{ grandTotal | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
            </div>
            <button class="btn btn-primary-custom w-100" (click)="proceedToCheckout()">
              Proceed to Checkout <i class="bi bi-arrow-right ms-2"></i>
            </button>
            <button class="btn btn-outline-custom w-100 mt-2" (click)="clearCart()">
              <i class="bi bi-trash me-2"></i>Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`.text-orange { color: var(--primary); }`]
})
export class CartComponent implements OnInit {
  cart: CartResponse = { items: [], totalAmount: 0, totalItems: 0 };
  isLoading = false;
  get taxAmount(): number { return Math.round(this.cart.totalAmount * 0.10); }
  get grandTotal(): number { return this.cart.totalAmount + this.taxAmount; }

  constructor(private cartService: CartService, private toastr: ToastrService, private router: Router) {}

  ngOnInit(): void { this.loadCart(); }

  loadCart(): void {
    this.isLoading = true;
    this.cartService.getCart().subscribe({
      next: (cart) => { this.cart = cart; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  updateQty(item: CartItem, qty: number): void {
    if (qty < 1) { this.removeItem(item.id); return; }
    this.cartService.updateQuantity(item.id, qty).subscribe({
      next: () => { this.loadCart(); this.cartService.refreshCartCount(); },
      error: () => this.toastr.error('Failed to update quantity.')
    });
  }

  removeItem(itemId: number): void {
    this.cartService.removeItem(itemId).subscribe({
      next: () => { this.toastr.success('Item removed.'); this.loadCart(); this.cartService.refreshCartCount(); },
      error: () => this.toastr.error('Failed to remove item.')
    });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      next: () => { this.toastr.success('Cart cleared.'); this.loadCart(); this.cartService.refreshCartCount(); },
      error: () => this.toastr.error('Failed to clear cart.')
    });
  }

  proceedToCheckout(): void { this.router.navigate(['/checkout']); }

  onImageError(event: any): void {
    event.target.src = 'https://placehold.co/80x80/121212/D9381E?text=Food';
  }
}
