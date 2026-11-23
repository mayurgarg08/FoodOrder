import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  template: `
    <div class="auth-container">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-5">
            <div class="auth-card glass-card p-4 p-md-5 animate-fade-in">
              <div class="text-center mb-4">
                <i class="bi bi-key fs-1 text-orange"></i>
                <h2 class="mt-2 fw-bold">Reset Password</h2>
                <p class="text-muted">Enter your email to receive a reset link</p>
              </div>
              <div *ngIf="emailSent" class="text-center">
                <i class="bi bi-check-circle fs-1 text-success"></i>
                <p class="mt-3">If an account with that email exists, a password reset link has been sent.</p>
                <a routerLink="/login" class="btn btn-outline-custom mt-3">Back to Login</a>
              </div>
              <form *ngIf="!emailSent" [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
                <div class="mb-4">
                  <label class="form-label small fw-semibold">Email Address</label>
                  <input type="email" class="form-control form-control-custom" formControlName="email" placeholder="you@example.com">
                </div>
                <button type="submit" class="btn btn-primary-custom w-100" [disabled]="isLoading">
                  <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
                </button>
              </form>
              <p class="text-center mt-4 text-muted small">
                Remember your password? <a routerLink="/login" class="fw-semibold">Sign in</a>
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
    .text-success { color: var(--success) !important; }
  `]
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  isLoading = false;
  emailSent = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private toastr: ToastrService) {
    this.forgotForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) return;
    this.isLoading = true;
    this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
      next: () => { this.isLoading = false; this.emailSent = true; },
      error: () => { this.isLoading = false; this.emailSent = true; }
    });
  }
}
