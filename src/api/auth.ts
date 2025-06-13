import api from './client';
import { AppUser } from '../models/types';

interface AuthResponse {
  token: string;
  user: AppUser;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};
