import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartItem, CartResponse } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  cartCount$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.apiUrl);
  }

  addToCart(foodId: number, quantity: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, { foodId, quantity });
  }

  updateQuantity(itemId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${itemId}`, quantity);
  }

  removeItem(itemId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${itemId}`);
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/clear`);
  }

  refreshCartCount(): void {
    this.getCart().subscribe({
      next: (cart) => this.cartCount$.next(cart.totalItems),
      error: () => this.cartCount$.next(0)
    });
  }
}
