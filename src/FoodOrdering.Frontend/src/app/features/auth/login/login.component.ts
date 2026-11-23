import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="auth-container">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-5">
            <div class="auth-card glass-card p-4 p-md-5 animate-fade-in">
              <div class="text-center mb-4">
                <i class="bi bi-fire fs-1 text-orange"></i>
                <h2 class="mt-2 fw-bold">Welcome Back</h2>
                <p class="text-muted">Sign in to your account</p>
              </div>
              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Email Address</label>
                  <input type="email" class="form-control form-control-custom" formControlName="email" placeholder="you@example.com">
                  <div *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="text-danger small mt-1">
                    Valid email is required.
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Password</label>
                  <input type="password" class="form-control form-control-custom" formControlName="password" placeholder="••••••••">
                  <div *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" class="text-danger small mt-1">
                    Password is required.
                  </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <a routerLink="/forgot-password" class="small">Forgot password?</a>
                </div>
                <button type="submit" class="btn btn-primary-custom w-100" [disabled]="isLoading">
                  <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isLoading ? 'Signing in...' : 'Sign In' }}
                </button>
              </form>
              <p class="text-center mt-4 text-muted small">
                Don't have an account? <a routerLink="/register" class="fw-semibold">Create one</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height: calc(100vh - 140px); display: flex; align-items: center; padding: 40px 0; }
    .auth-card { max-width: 440px; margin: 0 auto; }
    .text-orange { color: var(--primary); }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.isLoading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.toastr.success(`Welcome back, ${res.fullName}!`);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || (res.role === 'Admin' ? '/admin/dashboard' : '/home');
        this.router.navigate([returnUrl]);
      },
      error: (err) => {
        this.isLoading = false;
        this.toastr.error(err.error?.message || 'Login failed. Please check your credentials.');
      }
    });
  }
}
