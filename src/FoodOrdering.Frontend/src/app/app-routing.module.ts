import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { HomeComponent } from './features/customer/home/home.component';
import { FoodListComponent } from './features/customer/food-list/food-list.component';
import { FoodDetailComponent } from './features/customer/food-detail/food-detail.component';
import { CartComponent } from './features/customer/cart/cart.component';
import { CheckoutComponent } from './features/customer/checkout/checkout.component';
import { OrderHistoryComponent } from './features/customer/order-history/order-history.component';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard.component';
import { FoodManagementComponent } from './features/admin/food-management/food-management.component';
import { CategoryManagementComponent } from './features/admin/category-management/category-management.component';
import { OrderManagementComponent } from './features/admin/order-management/order-management.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'foods', component: FoodListComponent, canActivate: [authGuard] },
  { path: 'foods/:id', component: FoodDetailComponent, canActivate: [authGuard] },
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'orders', component: OrderHistoryComponent, canActivate: [authGuard] },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'foods', component: FoodManagementComponent },
      { path: 'categories', component: CategoryManagementComponent },
      { path: 'orders', component: OrderManagementComponent }
    ]
  },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
