export type UserRole = 'admin' | 'lector' | 'user';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  password_plain?: string;  // Devuelto por el backend, opcional en el tipo
  customer?: Customer;
}

export interface Customer {
  id: string;
  user_id: string;
  customer_code: string;
  house_photo: string;
  latitude: number;
  longitude: number;
  address: string;
  user?: User;
}

export interface Reading {
  id: string;
  customer_id: string;
  lector_id: string;
  previous_reading: number;
  current_reading: number;
  consumption: number;
  total_amount: number;
  is_paid: boolean;
  reading_date: string;
  month: number;
  year: number;
  notes: string;
  customer?: Customer;
  lector?: User;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  reading_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  status: 'pending' | 'paid';
  reading?: Reading;
}

export interface LoginResponse {
  token: string;
  user: User;
}
