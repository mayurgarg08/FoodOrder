import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, PlaceOrder, Invoice, RazorpayOrder, RazorpayCheckoutResponse } from '../../shared/models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = `${environment.apiUrl}/order`;

  constructor(private http: HttpClient) {}

  placeOrder(data: PlaceOrder): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/place`, data);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/my-orders`);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/all`);
  }

  downloadSalesReport(period: 'daily' | 'weekly' | 'monthly', date: string, format: 'pdf' | 'excel'): Observable<Blob> {
    const params = { period, date, format };
    return this.http.get(`${environment.apiUrl}/admin/reports/sales`, { params, responseType: 'blob' });
  }

  updateStatus(orderId: number, status: string): Observable<Order> {
    // OrderStatus is an integer enum in the API (Pending=0 through Cancelled=5).
    // Sending the numeric value also works with an API process that has not yet
    // loaded the JsonStringEnumConverter configuration.
    const statusValues: Record<string, number> = {
      Pending: 0,
      Confirmed: 1,
      Preparing: 2,
      OutForDelivery: 3,
      Delivered: 4,
      Cancelled: 5
    };

    return this.http.put<Order>(`${this.apiUrl}/${orderId}/status`, {
      status: statusValues[status]
    });
  }

  getInvoice(orderId: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/${orderId}/invoice`);
  }

  generateInvoice(orderId: number): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/${orderId}/invoice/generate`, {});
  }

  downloadInvoicePdf(orderId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${orderId}/invoice/pdf`, { responseType: 'blob' });
  }

  createRazorpayOrder(): Observable<RazorpayOrder> {
    return this.http.post<RazorpayOrder>(`${environment.apiUrl}/payment/razorpay/order`, {});
  }

  verifyRazorpayPayment(payment: RazorpayCheckoutResponse, deliveryAddress: string): Observable<Order> {
    return this.http.post<Order>(`${environment.apiUrl}/payment/razorpay/verify`, {
      razorpayOrderId: payment.razorpay_order_id,
      razorpayPaymentId: payment.razorpay_payment_id,
      razorpaySignature: payment.razorpay_signature,
      deliveryAddress
    });
  }
}
