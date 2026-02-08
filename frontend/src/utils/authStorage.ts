import type { AuthResponse, User } from '../types/auth';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'makeit_access_token',
  REFRESH_TOKEN: 'makeit_refresh_token',
  USER: 'makeit_user',
} as const;

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
}

export function getUser(): User | null {
  const userJson = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userJson) {
    return null;
  }
  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function clearAll(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export function setAuthData(response: AuthResponse): void {
  setAccessToken(response.accessToken);
  setRefreshToken(response.refreshToken);
  setUser(response.user);
}
