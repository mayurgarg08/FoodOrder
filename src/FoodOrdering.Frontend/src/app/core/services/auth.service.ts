import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginModel, RegisterModel, AuthResponse } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUser$ = new BehaviorSubject<AuthResponse | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem('token');
    if (token) {
      this.currentUser$.next({
        token,
        role: localStorage.getItem('role') || '',
        fullName: localStorage.getItem('fullName') || '',
        email: localStorage.getItem('email') || '',
        expiresAt: localStorage.getItem('expiresAt') || ''
      });
    }
  }

  register(data: RegisterModel): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.storeAuthData(res))
    );
  }

  login(data: LoginModel): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(res => this.storeAuthData(res))
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(data: { email: string; token: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  logout(): void {
    localStorage.clear();
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isAdmin(): boolean {
    return localStorage.getItem('role') === 'Admin';
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  getFullName(): string {
    return localStorage.getItem('fullName') || '';
  }

  getEmail(): string {
    return localStorage.getItem('email') || '';
  }

  getCurrentUser(): Observable<AuthResponse | null> {
    return this.currentUser$.asObservable();
  }

  private storeAuthData(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('role', res.role);
    localStorage.setItem('fullName', res.fullName);
    localStorage.setItem('email', res.email);
    localStorage.setItem('expiresAt', res.expiresAt);
    this.currentUser$.next(res);
  }
}
