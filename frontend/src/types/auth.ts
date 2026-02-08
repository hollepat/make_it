export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  inviteCode: string;
}

export interface InviteCode {
  id: string;
  code: string;
  expiresAt: string;
  createdAt: string;
  usedByEmail: string | null;
}
