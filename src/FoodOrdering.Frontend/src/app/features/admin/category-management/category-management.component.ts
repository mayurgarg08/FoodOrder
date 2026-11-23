import { Component, OnInit } from '@angular/core';
import { FoodService } from '../../../core/services/food.service';
import { ToastrService } from 'ngx-toastr';
import { Category } from '../../../shared/models/food.model';

@Component({
  selector: 'app-category-management',
  template: `
    <div class="container animate-fade-in">
      <div class="page-header d-flex justify-content-between align-items-center">
        <h1><i class="bi bi-tags me-2"></i>Category Management</h1>
        <button class="btn btn-primary-custom" (click)="addNew()"><i class="bi bi-plus-lg me-2"></i>Add Category</button>
      </div>
      <div class="table-responsive">
        <table class="table table-custom">
          <thead><tr><th>Name</th><th>Description</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let cat of categories">
              <td *ngIf="editingId !== cat.id" class="fw-semibold">{{ cat.name }}</td>
              <td *ngIf="editingId === cat.id"><input type="text" class="form-control form-control-custom form-control-sm" [(ngModel)]="editForm.name"></td>
              <td *ngIf="editingId !== cat.id" class="text-muted small">{{ cat.description }}</td>
              <td *ngIf="editingId === cat.id"><input type="text" class="form-control form-control-custom form-control-sm" [(ngModel)]="editForm.description"></td>
              <td><span class="badge" [ngClass]="cat.isActive ? 'badge-delivered' : 'badge-cancelled'">{{ cat.isActive ? 'Yes' : 'No' }}</span></td>
              <td>
                <span *ngIf="editingId !== cat.id">
                  <button class="btn btn-sm btn-outline-custom me-1" (click)="startEdit(cat)"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm text-danger" (click)="deleteCategory(cat.id)"><i class="bi bi-trash"></i></button>
                </span>
                <span *ngIf="editingId === cat.id">
                  <button class="btn btn-sm btn-primary-custom me-1" (click)="saveEdit()">Save</button>
                  <button class="btn btn-sm btn-outline-custom" (click)="cancelEdit()">Cancel</button>
                </span>
              </td>
            </tr>
            <tr *ngIf="isAdding">
              <td><input type="text" class="form-control form-control-custom form-control-sm" [(ngModel)]="newCategory.name" placeholder="Category name"></td>
              <td><input type="text" class="form-control form-control-custom form-control-sm" [(ngModel)]="newCategory.description" placeholder="Description"></td>
              <td><span class="badge badge-delivered">Yes</span></td>
              <td>
                <button class="btn btn-sm btn-primary-custom me-1" (click)="saveNew()">Save</button>
                <button class="btn btn-sm btn-outline-custom" (click)="isAdding=false">Cancel</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class CategoryManagementComponent implements OnInit {
  categories: Category[] = [];
  editingId: number | null = null;
  editForm: Category = { id: 0, name: '', description: '', imageUrl: '', isActive: true };
  isAdding = false;
  newCategory: Category = { id: 0, name: '', description: '', imageUrl: '', isActive: true };

  constructor(private foodService: FoodService, private toastr: ToastrService) {}

  ngOnInit(): void { this.loadCategories(); }

  loadCategories(): void {
    this.foodService.getCategories().subscribe(cats => this.categories = cats);
  }

  startEdit(cat: Category): void {
    this.editingId = cat.id;
    this.editForm = { ...cat };
  }

  cancelEdit(): void { this.editingId = null; }

  saveEdit(): void {
    this.foodService.updateCategory(this.editForm.id, this.editForm).subscribe({
      next: () => { this.toastr.success('Category updated.'); this.editingId = null; this.loadCategories(); },
      error: () => this.toastr.error('Failed to update category.')
    });
  }

  addNew(): void { this.isAdding = true; this.newCategory = { id: 0, name: '', description: '', imageUrl: '', isActive: true }; }

  saveNew(): void {
    if (!this.newCategory.name.trim()) return;
    this.foodService.createCategory(this.newCategory).subscribe({
      next: () => { this.toastr.success('Category added.'); this.isAdding = false; this.loadCategories(); },
      error: () => this.toastr.error('Failed to add category.')
    });
  }

  deleteCategory(id: number): void {
    if (confirm('Are you sure?')) {
      this.foodService.deleteCategory(id).subscribe({
        next: () => { this.toastr.success('Category deleted.'); this.loadCategories(); },
        error: () => this.toastr.error('Failed to delete category.')
      });
    }
  }
}
