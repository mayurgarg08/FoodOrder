import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CartResponse } from '../../../shared/models/user.model';
import { RazorpayCheckoutResponse, RazorpayOrder } from '../../../shared/models/order.model';

@Component({
  selector: 'app-checkout',
  template: `
    <div class="container animate-fade-in">
      <div class="page-header"><h1><i class="bi bi-credit-card me-2"></i>Checkout</h1></div>
      <div class="row">
        <div class="col-lg-7 mb-4">
          <div class="card-custom p-4">
            <h5 class="fw-bold mb-4">Delivery Details</h5>
            <form [formGroup]="checkoutForm">
              <div class="mb-3">
                <label class="form-label small fw-semibold">Delivery Address</label>
                <textarea class="form-control form-control-custom" formControlName="deliveryAddress" rows="3" placeholder="Enter your delivery address"></textarea>
                <div *ngIf="checkoutForm.get('deliveryAddress')?.invalid && checkoutForm.get('deliveryAddress')?.touched" class="text-danger small mt-1">Address is required.</div>
              </div>
              <div class="mb-3">
                <label class="form-label small fw-semibold">Payment Method</label>
                <select class="form-select form-control-custom" formControlName="paymentMethod">
                  <option value="CashOnDelivery">Cash on Delivery</option>
                  <option value="Razorpay">Pay Online</option>
                </select>
                <small *ngIf="checkoutForm.get('paymentMethod')?.value === 'Razorpay'" class="text-muted d-block mt-2">
                  Test Mode only. No real payment will be collected.
                </small>
              </div>
            </form>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="card-custom p-4">
            <h5 class="fw-bold mb-3">Order Summary</h5>
            <div *ngFor="let item of cart.items" class="d-flex justify-content-between mb-2">
              <span class="text-muted small">{{ item.foodName }} x{{ item.quantity }}</span>
              <span class="small">{{ item.subTotal | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
            </div>
            <hr style="border-color: var(--border-color);">
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">Subtotal</span>
              <span>{{ cart.totalAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">Tax (10%)</span>
              <span>{{ taxAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
            </div>
            <hr style="border-color: var(--border-color);">
            <div class="d-flex justify-content-between mb-4">
              <span class="fw-bold fs-5">Grand Total</span>
              <span class="fw-bold fs-5 text-orange">{{ grandTotal | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
            </div>
            <button class="btn btn-primary-custom w-100 btn-lg" [disabled]="isPlacing" (click)="placeOrder()">
              <span *ngIf="isPlacing" class="spinner-border spinner-border-sm me-2"></span>
              {{ isPlacing ? (checkoutForm.get('paymentMethod')?.value === 'Razorpay' ? 'Opening secure checkout...' : 'Placing Order...') : (checkoutForm.get('paymentMethod')?.value === 'Razorpay' ? 'Pay with Razorpay' : 'Place Order') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`.text-orange { color: var(--primary); }`]
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  cart: CartResponse = { items: [], totalAmount: 0, totalItems: 0 };
  isPlacing = false;
  get taxAmount(): number { return Math.round(this.cart.totalAmount * 0.10); }
  get grandTotal(): number { return this.cart.totalAmount + this.taxAmount; }

  constructor(
    private fb: FormBuilder, private cartService: CartService, private orderService: OrderService,
    private authService: AuthService, private router: Router, private toastr: ToastrService
  ) {
    this.checkoutForm = this.fb.group({
      deliveryAddress: ['', Validators.required],
      paymentMethod: ['CashOnDelivery']
    });
  }

  ngOnInit(): void {
    this.cartService.getCart().subscribe(cart => {
      this.cart = cart;
      if (cart.items.length === 0) { this.router.navigate(['/cart']); }
    });
  }

  placeOrder(): void {
    if (this.checkoutForm.invalid) return;
    this.isPlacing = true;
    if (this.checkoutForm.value.paymentMethod === 'Razorpay') {
      this.startRazorpayPayment();
      return;
    }

    this.orderService.placeOrder(this.checkoutForm.value).subscribe({
      next: (order) => {
        this.isPlacing = false;
        this.completeOrder();
      },
      error: (err) => {
        this.isPlacing = false;
        this.toastr.error(err.error?.message || 'Failed to place order.');
      }
    });
  }

  private startRazorpayPayment(): void {
    this.orderService.createRazorpayOrder().subscribe({
      next: (razorpayOrder) => this.openRazorpayCheckout(razorpayOrder),
      error: (err) => {
        this.isPlacing = false;
        this.toastr.error(err.error?.message || 'Could not start Razorpay checkout.');
      }
    });
  }

  private openRazorpayCheckout(order: RazorpayOrder): void {
    this.loadRazorpayScript().then((loaded) => {
      const RazorpayCheckout = (window as any).Razorpay;
      if (!loaded || !RazorpayCheckout) {
        this.isPlacing = false;
        this.toastr.error('Razorpay Checkout could not be loaded.');
        return;
      }

      const checkout = new RazorpayCheckout({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'FoodOrder',
        description: 'Food order payment',
        order_id: order.orderId,
        prefill: {
          name: this.authService.getFullName(),
          email: this.authService.getEmail()
        },
        theme: { color: '#D9381E' },
        handler: (response: RazorpayCheckoutResponse) => this.verifyRazorpayPayment(response),
        modal: { ondismiss: () => this.isPlacing = false }
      });

      checkout.on('payment.failed', (response: any) => {
        this.isPlacing = false;
        this.toastr.error(response?.error?.description || 'Razorpay payment failed. You can try again.');
      });
      checkout.open();
    });
  }

  private verifyRazorpayPayment(payment: RazorpayCheckoutResponse): void {
    const deliveryAddress = this.checkoutForm.value.deliveryAddress;
    this.orderService.verifyRazorpayPayment(payment, deliveryAddress).subscribe({
      next: () => {
        this.isPlacing = false;
        this.completeOrder();
      },
      error: (err) => {
        this.isPlacing = false;
        this.toastr.error(err.error?.message || 'Payment was received but could not be verified. Contact support before retrying.');
      }
    });
  }

  private loadRazorpayScript(): Promise<boolean> {
    if ((window as any).Razorpay) return Promise.resolve(true);

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  private completeOrder(): void {
    this.toastr.success('Order placed successfully!');
    this.cartService.refreshCartCount();
    this.router.navigate(['/orders']);
  }
}
