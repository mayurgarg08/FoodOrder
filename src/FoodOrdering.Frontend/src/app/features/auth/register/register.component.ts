import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="auth-container">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-6">
            <div class="auth-card glass-card p-4 p-md-5 animate-fade-in">
              <div class="text-center mb-4">
                <i class="bi bi-fire fs-1 text-orange"></i>
                <h2 class="mt-2 fw-bold">Create Account</h2>
                <p class="text-muted">Join us for delicious food delivery</p>
              </div>
              <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Full Name</label>
                  <input type="text" class="form-control form-control-custom" formControlName="fullName" placeholder="John Doe">
                  <div *ngIf="registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched" class="text-danger small mt-1">Full name is required.</div>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Email Address</label>
                  <input type="email" class="form-control form-control-custom" formControlName="email" placeholder="you@example.com">
                  <div *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched" class="text-danger small mt-1">Valid email is required.</div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label small fw-semibold">Password</label>
                    <input type="password" class="form-control form-control-custom" formControlName="password" placeholder="Min 8 characters">
                    <div *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched" class="text-danger small mt-1">Min 8 characters required.</div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label small fw-semibold">Confirm Password</label>
                    <input type="password" class="form-control form-control-custom" formControlName="confirmPassword" placeholder="Re-enter password">
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Delivery Address</label>
                  <textarea class="form-control form-control-custom" formControlName="address" rows="2" placeholder="Your delivery address"></textarea>
                </div>
                <button type="submit" class="btn btn-primary-custom w-100" [disabled]="isLoading">
                  <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isLoading ? 'Creating account...' : 'Create Account' }}
                </button>
              </form>
              <p class="text-center mt-4 text-muted small">
                Already have an account? <a routerLink="/login" class="fw-semibold">Sign in</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height: calc(100vh - 140px); display: flex; align-items: center; padding: 40px 0; }
    .text-orange { color: var(--primary); }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private toastr: ToastrService) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      address: ['']
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
      this.toastr.error('Passwords do not match.');
      return;
    }
    this.isLoading = true;
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastr.success('Account created successfully!');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.toastr.error(err.error?.message || 'Registration failed.');
      }
    });
  }
}
