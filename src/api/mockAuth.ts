import { AppUser } from '../models/types';
import { fakeJwt } from '../utils/fakeJwt';
export const mockLogin = async (email: string, password: string) => {
  console.log('[mockLogin] email', email);
  return new Promise<{ token: string; user: AppUser }>((res) => {
    setTimeout(() => {
      res({
        token: fakeJwt(),
        user: {
          id: 'u1', username: 'mock', email, displayName: 'Mock User', weeklyPoints: 0, joinedAt: new Date().toISOString(),
        },
      });
    }, 500);
  });
};
export const mockRegister = mockLogin;