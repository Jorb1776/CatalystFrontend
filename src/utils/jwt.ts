// src/utils/jwt.ts
export const getUsernameFromToken = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Your JWT likely has "name" or "unique_name" or "sub"
    return payload.name || payload.unique_name || payload.sub || payload.email || null;
  } catch {
    return null;
  }
};