// src/types/Auth.ts
export interface LoginResponse {
  initials?: string;
  username?: string;
  token: string;
  refreshToken: string;
  role: string;
  defaultLocation?: string;
}

export interface RefreshResponse {
  token: string;
}
