import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as apiLogin, register as apiRegister } from '../services/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await apiLogin(email, password);
        const { token, user } = res.data;
        localStorage.setItem('jt_token', token);
        set({ token, user, isAuthenticated: true });
        return user;
      },

      register: async (name, email, password) => {
        const res = await apiRegister(name, email, password);
        const { token, user } = res.data;
        localStorage.setItem('jt_token', token);
        set({ token, user, isAuthenticated: true });
        return user;
      },

      logout: () => {
        localStorage.removeItem('jt_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),
    }),
    {
      name: 'jt-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
