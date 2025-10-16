import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from '../lib/api.js';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  initAuth: () => {
    const token = Cookies.get('token');
    const userStr = Cookies.get('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      } catch (error) {
        console.error('Failed to parse user data:', error);
        Cookies.remove('token');
        Cookies.remove('user');
      }
    }
  },

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data.data;

      Cookies.set('token', token, { expires: 7 });
      Cookies.set('user', JSON.stringify(user), { expires: 7 });

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  },

  logout: () => {
    Cookies.remove('token');
    Cookies.remove('user');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  updateUser: (userData) => {
    const updatedUser = { ...useAuthStore.getState().user, ...userData };
    Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
    set({ user: updatedUser });
  },
}));

export default useAuthStore;
