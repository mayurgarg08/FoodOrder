import { Component, OnDestroy, OnInit } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { OrderTrackingService } from '../../../core/services/order-tracking.service';
import { ToastrService } from 'ngx-toastr';
import { Order } from '../../../shared/models/order.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-history',
  template: `
    <div class="container animate-fade-in">
      <div class="page-header"><h1><i class="bi bi-clock-history me-2"></i>My Orders</h1></div>
      <app-spinner [isLoading]="isLoading"></app-spinner>
      <div *ngIf="!isLoading && orders.length === 0" class="empty-state">
        <i class="bi bi-bag-x"></i>
        <h3>No orders yet</h3>
        <p>Your order history will appear here.</p>
        <a routerLink="/foods" class="btn btn-primary-custom mt-3">Start Ordering</a>
      </div>
      <div *ngIf="!isLoading" class="row g-4">
        <div class="col-12" *ngFor="let order of orders">
          <div class="order-card">
            <div class="order-card-header">
              <div>
                <h5 class="order-id">Order #{{ order.id }}</h5>
                <span class="order-date">{{ order.orderDate | date:'medium' }}</span>
              </div>
              <span class="badge badge-status" [ngClass]="'badge-' + order.status.toLowerCase()">{{ order.status }}</span>
            </div>

            <section class="tracking-panel" aria-label="Order progress">
              <div class="tracking-heading">
                <h6><i class="bi bi-geo-alt me-2"></i>Order progress</h6>
                <span class="live-indicator" [class.connected]="trackingConnected">
                  <i class="bi bi-broadcast"></i>{{ trackingConnected ? 'Live updates on' : 'Connecting to live updates' }}
                </span>
              </div>
              <div *ngIf="order.status === 'Cancelled'; else orderProgress" class="cancelled-message">
                <i class="bi bi-x-circle-fill"></i><span>This order was cancelled.</span>
              </div>
              <ng-template #orderProgress>
                <div class="tracking-track">
                  <ng-container *ngFor="let step of trackingSteps; let i = index">
                    <div class="tracking-step" [class.complete]="trackingStepIndex(order.status) > i" [class.current]="trackingStepIndex(order.status) === i">
                      <span class="step-marker"><i class="bi" [ngClass]="trackingStepIndex(order.status) > i ? 'bi-check-lg' : step.icon"></i></span>
                      <span class="step-label">{{ step.label }}</span>
                    </div>
                    <span *ngIf="i < trackingSteps.length - 1" class="step-connector" [class.complete]="trackingStepIndex(order.status) > i"></span>
                  </ng-container>
                </div>
                <p class="tracking-message mb-0"><i class="bi bi-info-circle me-2"></i>{{ statusMessage(order.status) }}
                  <small *ngIf="statusUpdateTimes[order.id]">Updated {{ statusUpdateTimes[order.id] | date:'shortTime' }}</small>
                </p>
              </ng-template>
            </section>

            <div class="order-details-panel" *ngIf="expandedOrder === order.id">
              <!-- Order Items -->
              <div class="order-items-section">
                <h6 class="section-title">Items Ordered</h6>
                <div class="order-item-row" *ngFor="let item of order.orderItems">
                  <img [src]="item.foodImageUrl | imageUrl" class="item-thumb" [alt]="item.foodName" (error)="onImageError($event)">
                  <div class="item-info">
                    <span class="item-name">{{ item.foodName }}</span>
                    <span class="item-meta">Qty: {{ item.quantity }} × {{ item.unitPrice | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
                  </div>
                  <span class="item-subtotal">{{ item.subTotal | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
                </div>
              </div>

              <!-- Invoice Summary -->
              <div class="invoice-summary" *ngIf="order.invoice">
                <div class="invoice-row"><span class="inv-label">Invoice No.</span><span class="inv-value">{{ order.invoice.invoiceNumber }}</span></div>
                <div class="invoice-row"><span class="inv-label">Delivery Address</span><span class="inv-value">{{ order.deliveryAddress }}</span></div>
                <div class="invoice-row"><span class="inv-label">Subtotal</span><span class="inv-value">{{ order.invoice.subTotal | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span></div>
                <div class="invoice-row"><span class="inv-label">Tax</span><span class="inv-value">{{ order.invoice.tax | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span></div>
                <div class="invoice-row total-row"><span class="inv-label">Grand Total</span><span class="inv-value grand-total">{{ order.invoice.grandTotal | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span></div>
              </div>
            </div>

            <div class="order-card-footer">
              <span class="order-total">{{ order.totalAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
              <div class="d-flex gap-2">
                <button *ngIf="order.invoice" class="btn btn-sm btn-primary-custom" (click)="downloadInvoice(order.id)" [disabled]="downloadingOrderId === order.id">
                  <i class="bi bi-download me-1"></i>{{ downloadingOrderId === order.id ? 'Preparing...' : 'Download Invoice PDF' }}
                </button>
                <button class="btn btn-sm btn-outline-custom" (click)="toggleOrder(order.id)">
                  <i class="bi" [ngClass]="expandedOrder === order.id ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                  {{ expandedOrder === order.id ? 'Hide Details' : 'View Details' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .order-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: var(--transition);
    }
    .order-card:hover { border-color: var(--border-color-light); box-shadow: var(--shadow-md); }
    .order-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
    }
    .order-id { color: var(--text-primary) !important; font-weight: 700; font-size: 1.1rem; margin: 0 0 4px 0; }
    .order-date { color: var(--text-muted) !important; font-size: 0.85rem; }
    .tracking-panel { padding: 19px 24px 20px; border-bottom: 1px solid var(--border-color); background: linear-gradient(110deg, rgba(217,56,30,.045), transparent 65%); }
    .tracking-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
    .tracking-heading h6 { margin: 0; color: var(--text-primary); font-weight: 700; }
    .tracking-heading h6 i { color: var(--primary); }
    .live-indicator { display: inline-flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: .72rem; }
    .live-indicator.connected { color: #34d399; }.live-indicator.connected i { animation: live-pulse 1.8s infinite; }
    .tracking-track { display: flex; align-items: flex-start; }
    .tracking-step { display: flex; min-width: 65px; flex-direction: column; align-items: center; gap: 7px; color: var(--text-muted); text-align: center; }
    .step-marker { display: grid; width: 31px; height: 31px; place-items: center; border: 1px solid var(--border-color); border-radius: 50%; background: var(--bg-card); font-size: .78rem; transition: .25s ease; }
    .tracking-step.complete { color: #34d399; }.tracking-step.current { color: var(--primary); }
    .tracking-step.complete .step-marker { border-color: #34d399; background: rgba(52,211,153,.13); }
    .tracking-step.current .step-marker { border-color: var(--primary); background: rgba(217,56,30,.15); box-shadow: 0 0 0 4px rgba(217,56,30,.08); }
    .step-label { font-size: .68rem; line-height: 1.2; white-space: nowrap; }
    .step-connector { flex: 1; height: 2px; margin: 15px 5px 0; background: var(--border-color); }.step-connector.complete { background: #34d399; }
    .tracking-message { margin-top: 15px; color: var(--text-secondary); font-size: .8rem; }.tracking-message > i { color: var(--primary); }.tracking-message small { margin-left: 8px; color: var(--text-muted); }
    .cancelled-message { display: flex; align-items: center; gap: 9px; color: #fb7185; font-weight: 600; }.cancelled-message i { font-size: 1.1rem; }
    @keyframes live-pulse { 50% { opacity: .4; } }
    .order-details-panel { border-bottom: 1px solid var(--border-color); }
    .order-items-section { padding: 20px 24px; }
    .section-title { color: var(--text-muted) !important; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 14px; }
    .order-item-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
    }
    .order-item-row:last-child { border-bottom: none; }
    .item-thumb { width: 52px; height: 52px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
    .item-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .item-name { color: var(--text-primary) !important; font-weight: 600; font-size: 0.95rem; }
    .item-meta { color: var(--text-muted) !important; font-size: 0.82rem; }
    .item-subtotal { color: var(--success) !important; font-weight: 700; font-size: 1rem; white-space: nowrap; }
    .invoice-summary { background: var(--bg-dark); padding: 16px 24px; display: flex; flex-direction: column; gap: 8px; }
    .invoice-row { display: flex; justify-content: space-between; align-items: center; }
    .inv-label { color: var(--text-muted) !important; font-size: 0.85rem; }
    .inv-value { color: var(--text-secondary) !important; font-size: 0.85rem; font-weight: 500; }
    .total-row { padding-top: 8px; border-top: 1px solid var(--border-color); margin-top: 4px; }
    .total-row .inv-label { color: var(--text-primary) !important; font-weight: 700; font-size: 1rem; }
    .grand-total { color: var(--success) !important; font-weight: 800; font-size: 1.1rem !important; }
    .order-card-footer { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; }
    .order-total { color: var(--success) !important; font-weight: 800; font-size: 1.4rem; }
    @media (max-width: 575.98px) {
      .tracking-panel { padding: 16px; }
      .tracking-step { min-width: 48px; }
      .step-label { font-size: .58rem; }
      .step-connector { margin-left: 2px; margin-right: 2px; }
      .order-card-header, .order-card-footer { padding-left: 16px; padding-right: 16px; }
      .order-card-footer { align-items: flex-start; flex-direction: column; gap: 12px; }
      .order-card-footer > div { width: 100%; flex-wrap: wrap; }
    }
  `]
})
export class OrderHistoryComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  isLoading = false;
  expandedOrder: number | null = null;
  downloadingOrderId: number | null = null;
  trackingConnected = false;
  statusUpdateTimes: Record<number, Date> = {};
  readonly trackingSteps = [
    { label: 'Placed', icon: 'bi-bag-check' },
    { label: 'Confirmed', icon: 'bi-check-circle' },
    { label: 'Preparing', icon: 'bi-fire' },
    { label: 'On the way', icon: 'bi-bicycle' },
    { label: 'Delivered', icon: 'bi-house-check' }
  ];
  private subscriptions = new Subscription();

  constructor(
    private orderService: OrderService,
    private trackingService: OrderTrackingService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.trackingService.statusUpdates$.subscribe(update => {
      const order = this.orders.find(item => item.id === update.orderId);
      if (!order) return;
      order.status = update.status;
      this.statusUpdateTimes[order.id] = new Date(update.updatedAt);
      this.toastr.info(`Order #${order.id} is now ${this.statusLabel(update.status)}.`);
    }));
    this.subscriptions.add(this.trackingService.connected$.subscribe(connected => this.trackingConnected = connected));

    this.isLoading = true;
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
        void this.trackingService.trackOrders(orders.map(order => order.id)).catch(() => {
          this.toastr.warning('Live tracking is unavailable right now. Order status will still appear here.');
        });
      },
      error: () => { this.isLoading = false; this.toastr.error('Failed to load orders.'); }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    void this.trackingService.stopTracking();
  }

  trackingStepIndex(status: string): number {
    const index: Record<string, number> = {
      Pending: 0, Confirmed: 1, Preparing: 2, OutForDelivery: 3, Delivered: 4
    };
    return index[status] ?? 0;
  }

  statusLabel(status: string): string {
    return status === 'OutForDelivery' ? 'Out for delivery' : status;
  }

  statusMessage(status: string): string {
    const messages: Record<string, string> = {
      Pending: 'We received your order and are waiting for the restaurant to confirm.',
      Confirmed: 'Your order is confirmed and will be prepared soon.',
      Preparing: 'The kitchen is preparing your food now.',
      OutForDelivery: 'Your food is on the way to your delivery address.',
      Delivered: 'Your order has been delivered. Enjoy your meal!'
    };
    return messages[status] || 'We are updating your order.';
  }

  toggleOrder(id: number): void {
    this.expandedOrder = this.expandedOrder === id ? null : id;
  }

  downloadInvoice(orderId: number): void {
    this.downloadingOrderId = orderId;
    this.orderService.downloadInvoicePdf(orderId).subscribe({
      next: (pdf) => {
        const url = URL.createObjectURL(pdf);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-order-${orderId}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        this.downloadingOrderId = null;
      },
      error: (error) => {
        this.downloadingOrderId = null;
        this.toastr.error(error?.error?.message || 'Failed to download invoice PDF.');
      }
    });
  }

  onImageError(event: any): void {
    event.target.src = 'https://placehold.co/50x50/121212/D9381E?text=Food';
  }
}
