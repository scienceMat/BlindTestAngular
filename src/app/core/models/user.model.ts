export interface User {
  id: number;
  userName: string;
  password: string;
  isAdmin: boolean;
  score?: number;
  ready?: boolean;
}

export interface UserResponse {
  id: number;
  username: string;
  token: string;
  admin: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface CreateUserRequest {
  userName: string;
  password: string;
  isAdmin: boolean;
}