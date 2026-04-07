export interface AuthResponse {
  token: string;
  name: string;
  userId: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  location: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}