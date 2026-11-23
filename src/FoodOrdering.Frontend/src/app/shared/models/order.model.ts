export interface Order {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  orderItems: OrderItem[];
  invoice?: Invoice;
}

export interface OrderItem {
  id: number;
  foodId: number;
  foodName: string;
  foodImageUrl: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface Invoice {
  id: number;
  orderId: number;
  invoiceNumber: string;
  generatedAt: string;
  subTotal: number;
  tax: number;
  grandTotal: number;
}

export interface PlaceOrder {
  deliveryAddress: string;
  paymentMethod: string;
}

export interface RazorpayOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
}

export interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
