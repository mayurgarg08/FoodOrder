import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { ImageUrlPipe } from './shared/pipes/image-url.pipe';

import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';

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

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    SpinnerComponent,
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    HomeComponent,
    FoodListComponent,
    FoodDetailComponent,
    CartComponent,
    CheckoutComponent,
    OrderHistoryComponent,
    AdminDashboardComponent,
    FoodManagementComponent,
    CategoryManagementComponent,
    OrderManagementComponent,
    ImageUrlPipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true
    })
  ],
  providers: [
    provideHttpClient(withInterceptors([jwtInterceptor]))
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
