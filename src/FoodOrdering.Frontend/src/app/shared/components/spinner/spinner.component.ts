import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `
    <div *ngIf="isLoading" class="spinner-overlay">
      <div class="spinner-container">
        <div class="spinner-border text-primary-custom" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-muted small">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 60px 0;
    }
    .spinner-container { text-align: center; }
    .text-primary-custom { color: var(--primary) !important; }
  `]
})
export class SpinnerComponent {
  @Input() isLoading = false;
  @Input() message = 'Loading...';
}
