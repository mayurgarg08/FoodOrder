export interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  categoryId: number;
  categoryName: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}
