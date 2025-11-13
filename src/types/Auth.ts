// src/types/Auth.ts
export interface LoginResponse {
  token: string;
  refreshToken: string;
  role: string;
}

export interface RefreshResponse {
  token: string;
}