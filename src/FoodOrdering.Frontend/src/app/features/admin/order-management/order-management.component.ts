import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { ToastrService } from 'ngx-toastr';
import { Order } from '../../../shared/models/order.model';

@Component({
  selector: 'app-order-management',
  template: `
    <div class="container animate-fade-in">
      <div class="page-header"><h1><i class="bi bi-bag-check me-2"></i>Order Management</h1></div>
      <app-spinner [isLoading]="isLoading"></app-spinner>
      <div class="table-responsive" *ngIf="!isLoading">
        <table class="food-table">
          <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th><th>Invoice</th></tr></thead>
          <tbody>
            <tr *ngFor="let order of orders">
              <td class="fw-bold">#{{ order.id }}</td>
              <td>
                <span class="fw-semibold">{{ order.userName || 'Customer' }}</span>
                <small class="d-block text-muted">{{ order.userEmail }}</small>
              </td>
              <td class="text-muted small">{{ order.orderDate | date:'short' }}</td>
              <td class="text-success fw-bold">{{ order.totalAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</td>
              <td><span class="badge badge-status" [ngClass]="'badge-' + order.status.toLowerCase()">{{ order.status }}</span></td>
              <td>
                <select class="form-select form-control-custom form-select-sm" style="width:160px"
                  [ngModel]="order.status" (ngModelChange)="updateStatus(order.id, $event)">
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Preparing">Preparing</option>
                  <option value="OutForDelivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </td>
              <td>
                <div *ngIf="order.invoice; else generateInvoiceAction">
                  <small class="d-block text-muted mb-1">{{ order.invoice.invoiceNumber }}</small>
                  <button class="btn btn-sm btn-outline-custom" (click)="downloadInvoice(order.id)" [disabled]="processingInvoiceOrderId === order.id">
                    {{ processingInvoiceOrderId === order.id ? 'Preparing...' : 'Download PDF' }}
                  </button>
                </div>
                <ng-template #generateInvoiceAction>
                  <button class="btn btn-sm btn-primary-custom" (click)="generateInvoice(order.id)" [disabled]="processingInvoiceOrderId === order.id">
                    {{ processingInvoiceOrderId === order.id ? 'Generating...' : 'Generate Invoice' }}
                  </button>
                </ng-template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div *ngIf="!isLoading && orders.length === 0" class="empty-state">
        <i class="bi bi-inbox"></i>
        <h3>No orders</h3>
        <p>Orders will appear here when customers place them.</p>
      </div>
    </div>
  `,
  styles: [`
    .food-table { width: 100%; border-collapse: collapse; }
    .food-table thead tr { background: var(--secondary-light) !important; }
    .food-table thead th {
      color: var(--text-muted) !important;
      font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;
      font-weight: 600; padding: 14px 16px; border: none;
    }
    .food-table tbody tr {
      background: var(--bg-card) !important;
      border-bottom: 1px solid var(--border-color) !important;
      transition: var(--transition);
    }
    .food-table tbody tr:hover { background: var(--bg-card-hover) !important; }
    .food-table tbody td {
      color: var(--text-primary) !important;
      padding: 14px 16px; border: none; vertical-align: middle;
    }
    .text-orange { color: var(--primary) !important; }
  `]
})
export class OrderManagementComponent implements OnInit {
  orders: Order[] = [];
  isLoading = false;
  statusOptions = ['Pending', 'Confirmed', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'];
  processingInvoiceOrderId: number | null = null;

  constructor(private orderService: OrderService, private toastr: ToastrService) {}

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getAllOrders().subscribe({
      next: (orders) => { this.orders = orders; this.isLoading = false; },
      error: () => { this.isLoading = false; this.toastr.error('Failed to load orders.'); }
    });
  }

  updateStatus(orderId: number, status: string): void {
    this.orderService.updateStatus(orderId, status).subscribe({
      next: () => { this.toastr.success('Order status updated.'); this.loadOrders(); },
      error: (error) => {
        const apiMessage = error?.error?.message;
        const detail = apiMessage || `HTTP ${error?.status || 'network error'}`;
        this.toastr.error(`Failed to update status. ${detail}`);
        this.loadOrders();
      }
    });
  }

  generateInvoice(orderId: number): void {
    this.processingInvoiceOrderId = orderId;
    this.orderService.generateInvoice(orderId).subscribe({
      next: (invoice) => {
        const order = this.orders.find(item => item.id === orderId);
        if (order) order.invoice = invoice;
        this.processingInvoiceOrderId = null;
        this.toastr.success(`Invoice ${invoice.invoiceNumber} generated.`);
      },
      error: (error) => {
        this.processingInvoiceOrderId = null;
        this.toastr.error(error?.error?.message || 'Failed to generate invoice.');
      }
    });
  }

  downloadInvoice(orderId: number): void {
    this.processingInvoiceOrderId = orderId;
    this.orderService.downloadInvoicePdf(orderId).subscribe({
      next: (pdf) => {
        this.savePdf(pdf, `invoice-order-${orderId}.pdf`);
        this.processingInvoiceOrderId = null;
      },
      error: () => {
        this.processingInvoiceOrderId = null;
        this.toastr.error('Failed to download invoice PDF.');
      }
    });
  }

  private savePdf(pdf: Blob, fileName: string): void {
    const url = URL.createObjectURL(pdf);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
