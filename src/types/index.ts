export type UserRole = 'Admin' | 'Manager' | 'Cashier' | 'Other';

export interface CloverAuthResponse {
  success: boolean;
  token?: string;
  role: UserRole;
  username: string;
  error?: string;
}

export interface UserSession {
  username: string;
  role: UserRole;
  isAuthenticated: boolean;
}