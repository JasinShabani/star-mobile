// src/redux/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { mockLogin } from '../api/mockAuth';

const slice = createSlice({
  name: 'auth',
  initialState: {
    token: null as string | null,
    user: null as any,
    loading: false,
  },
  reducers: {
    /** Synchronous mock login (used by Login.tsx) */
    login: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.loading = false;
    },
    logout: (state) => {
      state.token = null;
      state.user  = null;
    },
  },
  extraReducers: (builder) => {
    // Async thunk pattern (loginAsync) updates UI while waiting
    builder
      .addCase('auth/login/pending', (s) => {
        s.loading = true;
      })
      .addCase('auth/login/fulfilled', (s, a) => {
        s.loading = false;
        s.token   = a.payload.token;
        s.user    = a.payload.user;
      });
  },
});

export const loginAsync =
  (email: string, password: string) => async (dispatch: any) => {
    dispatch({ type: 'auth/login/pending' });
    const result = await mockLogin(email, password);
    dispatch({ type: 'auth/login/fulfilled', payload: result });
  };

export const { login, logout } = slice.actions;
export default slice.reducer;