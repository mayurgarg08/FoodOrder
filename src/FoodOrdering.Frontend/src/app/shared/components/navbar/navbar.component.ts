import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { FoodService } from '../../../core/services/food.service';
import { Food } from '../../models/food.model';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar navbar-expand-lg fixed-top navbar-custom">
      <div class="container">
        <a class="navbar-brand fw-bold" routerLink="/home">
          <i class="bi bi-fire text-orange"></i> FoodOrder
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <div class="navbar-search" *ngIf="!isAuthPage()">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input type="search" class="form-control" placeholder="Search food items..."
                aria-label="Search food items" [ngModel]="searchTerm" name="navbarSearch"
                (ngModelChange)="onSearchChange($event)" (keyup.enter)="openMenuSearch()">
              <button type="button" class="btn search-submit" aria-label="Search menu"
                (click)="openMenuSearch()"><i class="bi bi-arrow-right"></i></button>
            </div>
            <div class="search-results" *ngIf="searchTerm.trim().length >= 1">
              <button type="button" class="search-result" *ngFor="let food of searchResults"
                (mousedown)="$event.preventDefault()" (click)="openFood(food)">
                <img [src]="food.imageUrl | imageUrl" [alt]="" (error)="onSearchImageError($event)">
                <span class="search-result-copy">
                  <strong>{{ food.name }}</strong>
                  <small>{{ food.categoryName }} · {{ food.price | currency:'INR':'symbol':'1.0-0':'en-IN' }}</small>
                </span>
              </button>
              <div class="search-empty" *ngIf="searchResults.length === 0">No matching food items</div>
            </div>
          </div>
          <ul class="navbar-nav ms-auto" *ngIf="authService.isLoggedIn()">
            <li class="nav-item" *ngIf="!authService.isAdmin()">
              <a class="nav-link" routerLink="/home" routerLinkActive="active">
                <i class="bi bi-house"></i> Home
              </a>
            </li>
            <li class="nav-item" *ngIf="!authService.isAdmin()">
              <a class="nav-link" routerLink="/foods" routerLinkActive="active">
                <i class="bi bi-grid"></i> Menu
              </a>
            </li>
            <li class="nav-item" *ngIf="!authService.isAdmin()">
              <a class="nav-link" routerLink="/orders" routerLinkActive="active">
                <i class="bi bi-clock-history"></i> Orders
              </a>
            </li>
            <li class="nav-item" *ngIf="authService.isAdmin()">
              <a class="nav-link" routerLink="/admin/dashboard" routerLinkActive="active">
                <i class="bi bi-speedometer2"></i> Dashboard
              </a>
            </li>
            <li class="nav-item" *ngIf="authService.isAdmin()">
              <a class="nav-link" routerLink="/admin/foods" routerLinkActive="active">
                <i class="bi bi-cup-straw"></i> Foods
              </a>
            </li>
            <li class="nav-item" *ngIf="authService.isAdmin()">
              <a class="nav-link" routerLink="/admin/categories" routerLinkActive="active">
                <i class="bi bi-tags"></i> Categories
              </a>
            </li>
            <li class="nav-item" *ngIf="authService.isAdmin()">
              <a class="nav-link" routerLink="/admin/orders" routerLinkActive="active">
                <i class="bi bi-bag-check"></i> Orders
              </a>
            </li>
          </ul>
          <div class="d-flex align-items-center gap-3" *ngIf="authService.isLoggedIn()">
            <a *ngIf="!authService.isAdmin()" routerLink="/cart" class="cart-icon position-relative">
              <i class="bi bi-cart3 fs-5"></i>
              <span *ngIf="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
            </a>
            <div class="dropdown">
              <button class="btn btn-sm user-btn dropdown-toggle" data-bs-toggle="dropdown">
                <i class="bi bi-person-circle"></i> {{ authService.getFullName() }}
              </button>
              <ul class="dropdown-menu dropdown-menu-end dropdown-custom">
                <li><span class="dropdown-item-text small text-muted">{{ authService.getEmail() }}</span></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" (click)="authService.logout()"><i class="bi bi-box-arrow-right"></i> Logout</a></li>
              </ul>
            </div>
          </div>
          <div *ngIf="!authService.isLoggedIn()" class="d-flex gap-2">
            <a routerLink="/login" class="btn btn-outline-custom btn-sm">Login</a>
            <a routerLink="/register" class="btn btn-primary-custom btn-sm">Sign Up</a>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar-custom {
      background: rgba(10, 10, 10, 0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding: 14px 0;
      transition: var(--transition);
    }
    .navbar-brand { font-size: 1.5rem; color: var(--text-primary) !important; letter-spacing: -0.5px; }
    .text-orange { color: var(--primary); }
    .nav-link {
      color: var(--text-secondary) !important;
      font-weight: 600;
      font-size: 0.95rem;
      padding: 8px 18px !important;
      border-radius: var(--radius-md);
      transition: var(--transition);
      margin: 0 2px;
    }
    .nav-link:hover, .nav-link.active {
      color: var(--primary) !important;
      background: rgba(217, 56, 30, 0.08);
      transform: translateY(-1px);
    }
    .cart-icon { color: var(--text-primary); position: relative; padding: 8px; transition: var(--transition); }
    .cart-icon:hover { color: var(--primary); transform: scale(1.1); }
    .cart-badge {
      position: absolute;
      top: 0;
      right: -2px;
      background: var(--gradient-primary);
      color: white;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      box-shadow: 0 4px 10px rgba(217, 56, 30, 0.4);
    }
    .user-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-weight: 600;
      transition: var(--transition);
    }
    .user-btn:hover { border-color: var(--primary); color: var(--primary); background: rgba(217, 56, 30, 0.05); }
    .dropdown-custom {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: 8px 0;
      margin-top: 10px;
    }
    .dropdown-custom .dropdown-item {
      color: var(--text-secondary);
      transition: var(--transition);
      padding: 10px 20px;
      font-weight: 500;
    }
    .dropdown-custom .dropdown-item:hover {
      background: rgba(217, 56, 30, 0.05);
      color: var(--primary);
    }
    .navbar-toggler { border: none; padding: 0; }
    .navbar-toggler:focus { box-shadow: none; }
    .navbar-toggler-icon { filter: invert(1); width: 24px; height: 24px; }
    .navbar-search { position: relative; width: min(360px, 30vw); margin: 0 1rem; }
    .navbar-search .input-group-text, .navbar-search .form-control {
      background: var(--bg-card); border-color: var(--border-color); color: var(--text-primary);
    }
    .navbar-search .input-group-text { color: var(--text-muted); }
    .navbar-search .form-control::placeholder { color: var(--text-muted); }
    .navbar-search .search-submit { background: var(--primary); border-color: var(--primary); color: white; }
    .navbar-search .search-submit:hover { filter: brightness(1.1); }
    .search-results {
      position: absolute; z-index: 1050; top: calc(100% + 8px); left: 0; right: 0;
      max-height: 360px; overflow-y: auto; background: var(--bg-card);
      border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
    }
    .search-result {
      display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px;
      border: 0; border-bottom: 1px solid var(--border-color); text-align: left;
      background: transparent; color: var(--text-primary);
    }
    .search-result:last-child { border-bottom: 0; }
    .search-result:hover { background: rgba(217, 56, 30, 0.08); }
    .search-result img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
    .search-result-copy { display: flex; flex-direction: column; min-width: 0; }
    .search-result-copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .search-result-copy small, .search-empty { color: var(--text-muted); }
    .search-empty { padding: 12px; font-size: 0.9rem; }
    @media (max-width: 991.98px) {
      .navbar-search { width: 100%; margin: 0 0 0.75rem; }
      .navbar-nav { margin-left: 0 !important; }
      .navbar-collapse > .d-flex { margin-top: 0.5rem; }
    }
  `]
})
export class NavbarComponent implements OnInit {
  cartCount = 0;
  searchTerm = '';
  searchResults: Food[] = [];
  private searchSubject = new Subject<string>();

  constructor(
    public authService: AuthService,
    private cartService: CartService,
    private foodService: FoodService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.cartCount$.subscribe(count => this.cartCount = count);
    this.searchTerm = this.foodService.getMenuSearchTerm();
    this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(term => term.trim().length < 1
        ? of([] as Food[])
        : this.foodService.getAll(term.trim()).pipe(catchError(() => of([] as Food[]))))
    ).subscribe(foods => this.searchResults = foods);
    if (this.authService.isLoggedIn() && !this.authService.isAdmin()) {
      this.cartService.refreshCartCount();
    }
  }

  isAuthPage(): boolean {
    const path = this.router.url.split('?')[0].split('#')[0];
    return path === '/login' || path === '/register' || path === '/signup';
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.foodService.setMenuSearchTerm(term);
    this.searchSubject.next(term);
  }

  openFood(food: Food): void {
    this.searchResults = [];
    this.router.navigate(['/foods', food.id]);
  }

  openMenuSearch(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/foods'], { queryParams: { search: this.searchTerm.trim() } });
    }
  }

  onSearchImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://placehold.co/64x64/121212/D9381E?text=Food';
  }
}
