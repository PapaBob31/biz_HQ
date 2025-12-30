export type User = {
  username: string;
  role: 'Admin' | 'Manager' | 'Cashier' | 'Other'
};

export interface AuthResponse {
  success: boolean;
  user: User;
  username: string;
  error?: string;
}
