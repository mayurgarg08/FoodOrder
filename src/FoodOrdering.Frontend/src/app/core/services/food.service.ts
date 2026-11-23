import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Food, Category } from '../../shared/models/food.model';

@Injectable({ providedIn: 'root' })
export class FoodService {
  private readonly menuSearchSubject = new BehaviorSubject<string>('');
  readonly menuSearchTerm$ = this.menuSearchSubject.asObservable();
  private apiUrl = `${environment.apiUrl}/food`;
  private categoryUrl = `${environment.apiUrl}/category`;

  constructor(private http: HttpClient) {}

  setMenuSearchTerm(term: string): void {
    this.menuSearchSubject.next(term);
  }

  getMenuSearchTerm(): string {
    return this.menuSearchSubject.value;
  }

  getAll(search?: string, categoryId?: number): Observable<Food[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId.toString());
    return this.http.get<Food[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Food> {
    return this.http.get<Food>(`${this.apiUrl}/${id}`);
  }

  create(formData: FormData): Observable<Food> {
    return this.http.post<Food>(this.apiUrl, formData);
  }

  update(id: number, formData: FormData): Observable<Food> {
    return this.http.put<Food>(`${this.apiUrl}/${id}`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadImage(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/${id}/upload-image`, formData);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.categoryUrl);
  }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(this.categoryUrl, category);
  }

  updateCategory(id: number, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.categoryUrl}/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.categoryUrl}/${id}`);
  }
}
