export interface User {
  fullName: string;
  email: string;
  address: string;
}

export interface LoginModel {
  email: string;
  password: string;
}

export interface RegisterModel {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  fullName: string;
  email: string;
  expiresAt: string;
}

export interface CartItem {
  id: number;
  foodId: number;
  foodName: string;
  foodImageUrl: string;
  foodPrice: number;
  quantity: number;
  subTotal: number;
  addedAt: string;
}

export interface CartResponse {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}
