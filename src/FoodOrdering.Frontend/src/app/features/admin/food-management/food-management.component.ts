import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FoodService } from '../../../core/services/food.service';
import { ToastrService } from 'ngx-toastr';
import { Food, Category } from '../../../shared/models/food.model';

@Component({
  selector: 'app-food-management',
  template: `
    <div class="container animate-fade-in">
      <div class="page-header d-flex justify-content-between align-items-center">
        <h1><i class="bi bi-cup-straw me-2"></i>Food Management</h1>
        <button class="btn btn-primary-custom" (click)="openModal()"><i class="bi bi-plus-lg me-2"></i>Add Food</button>
      </div>
      <div class="table-responsive">
        <table class="food-table">
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Available</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let food of foods">
              <td><img [src]="food.imageUrl | imageUrl" class="rounded" style="width:50px;height:50px;object-fit:cover" [alt]="food.name" (error)="onImageError($event)"></td>
              <td class="fw-semibold">{{ food.name }}</td>
              <td><span class="badge badge-status badge-confirmed">{{ food.categoryName }}</span></td>
              <td class="text-orange fw-bold">{{ food.price | currency:'INR':'symbol':'1.0-0':'en-IN' }}</td>
              <td><span class="badge" [ngClass]="food.isAvailable ? 'badge-delivered' : 'badge-cancelled'">{{ food.isAvailable ? 'Yes' : 'No' }}</span></td>
              <td>
                <button class="btn btn-sm btn-outline-custom me-1" (click)="editFood(food)"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm text-danger" (click)="deleteFood(food.id)"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal fade" id="foodModal" tabindex="-1" [class.show]="showModal" [style.display]="showModal ? 'block' : 'none'" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content" style="background:var(--bg-card);border:1px solid var(--border-color)">
            <div class="modal-header" style="border-color:var(--border-color)">
              <h5 class="modal-title fw-bold">{{ editingId ? 'Edit Food' : 'Add Food' }}</h5>
              <button type="button" class="btn-close btn-close-white" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <form [formGroup]="foodForm">
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Name</label>
                  <input type="text" class="form-control form-control-custom" formControlName="name">
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Description</label>
                  <textarea class="form-control form-control-custom" formControlName="description" rows="2"></textarea>
                </div>
                <div class="row">
                  <div class="col-6 mb-3">
                    <label class="form-label small fw-semibold">Price</label>
                    <input type="number" class="form-control form-control-custom" formControlName="price" step="0.01">
                  </div>
                  <div class="col-6 mb-3">
                    <label class="form-label small fw-semibold">Category</label>
                    <select class="form-select form-control-custom" formControlName="categoryId">
                      <option *ngFor="let cat of categories" [ngValue]="cat.id">{{ cat.name }}</option>
                    </select>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Image</label>
                  <input type="file" class="form-control form-control-custom" (change)="onFileSelected($event)" accept="image/*">
                  <img *ngIf="imagePreview" [src]="imagePreview" class="mt-2 rounded" style="width:100px;height:100px;object-fit:cover">
                </div>
                <div class="form-check mb-3">
                  <input class="form-check-input" type="checkbox" formControlName="isAvailable" id="isAvail">
                  <label class="form-check-label" for="isAvail">Available</label>
                </div>
              </form>
            </div>
            <div class="modal-footer" style="border-color:var(--border-color)">
              <button class="btn btn-outline-custom" (click)="closeModal()">Cancel</button>
              <button class="btn btn-primary-custom" (click)="saveFood()" [disabled]="isSaving">
                {{ isSaving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .food-table { width: 100%; border-collapse: collapse; }
    .food-table thead tr { background: var(--secondary-light) !important; }
    .food-table thead th {
      color: var(--text-muted) !important;
      font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;
      font-weight: 600; padding: 14px 16px; border: none;
    }
    .food-table tbody tr {
      background: var(--bg-card) !important;
      border-bottom: 1px solid var(--border-color) !important;
      transition: var(--transition);
    }
    .food-table tbody tr:hover { background: var(--bg-card-hover) !important; }
    .food-table tbody td {
      color: var(--text-primary) !important;
      padding: 14px 16px; border: none; vertical-align: middle;
    }
    .text-orange { color: var(--primary) !important; }
    .form-label { color: var(--text-secondary) !important; }
  `]
})
export class FoodManagementComponent implements OnInit {
  foods: Food[] = [];
  categories: Category[] = [];
  foodForm: FormGroup;
  showModal = false;
  editingId: number | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isSaving = false;

  constructor(private fb: FormBuilder, private foodService: FoodService, private toastr: ToastrService) {
    this.foodForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0.01)]],
      categoryId: [null, Validators.required],
      isAvailable: [true]
    });
  }

  ngOnInit(): void {
    this.loadFoods();
    this.foodService.getCategories().subscribe(cats => this.categories = cats);
  }

  loadFoods(): void {
    this.foodService.getAll().subscribe(foods => this.foods = foods);
  }

  openModal(): void {
    this.editingId = null;
    this.foodForm.reset({ isAvailable: true, price: 0 });
    this.selectedFile = null;
    this.imagePreview = null;
    this.showModal = true;
  }

  editFood(food: Food): void {
    this.editingId = food.id;
    this.foodForm.patchValue({
      name: food.name, description: food.description, price: food.price,
      categoryId: food.categoryId, isAvailable: food.isAvailable
    });
    this.imagePreview = food.imageUrl;
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  saveFood(): void {
    if (this.foodForm.invalid) return;
    this.isSaving = true;
    const formData = new FormData();
    const val = this.foodForm.value;
    formData.append('name', val.name);
    formData.append('description', val.description || '');
    formData.append('price', val.price.toString());
    formData.append('categoryId', val.categoryId.toString());
    formData.append('isAvailable', val.isAvailable.toString());
    if (this.selectedFile) formData.append('image', this.selectedFile);

    const req = this.editingId
      ? this.foodService.update(this.editingId, formData)
      : this.foodService.create(formData);

    req.subscribe({
      next: () => {
        this.isSaving = false;
        this.toastr.success(this.editingId ? 'Food updated!' : 'Food added!');
        this.closeModal();
        this.loadFoods();
      },
      error: () => { this.isSaving = false; this.toastr.error('Failed to save food.'); }
    });
  }

  deleteFood(id: number): void {
    if (confirm('Are you sure you want to delete this food item?')) {
      this.foodService.delete(id).subscribe({
        next: () => { this.toastr.success('Food deleted.'); this.loadFoods(); },
        error: () => this.toastr.error('Failed to delete food.')
      });
    }
  }

  onImageError(event: any): void {
    event.target.src = 'https://placehold.co/50x50/121212/D9381E?text=Food';
  }
}
