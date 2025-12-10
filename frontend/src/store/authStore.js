import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { useRouter } from 'next/navigation';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Login
      login: async (username, password) => {
        try {
          const response = await api.post('/auth/login', { username, password });
          const { user, token } = response.data.data;

          // Set token to API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Update state
          set({ user, token, isAuthenticated: true });
          
          return { success: true };
        } catch (error) {
          console.error('Login error:', error);
          return { 
            success: false, 
            message: error.response?.data?.message || 'Login failed' 
          };
        }
      },

      // Logout
      logout: () => {
        // Clear token from API headers
        delete api.defaults.headers.common['Authorization'];
        
        // Clear state
        set({ user: null, token: null, isAuthenticated: false });
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      // Initialize auth from localStorage
      initializeAuth: () => {
        const state = get();
        if (state.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }),
    {
      name: 'auth-storage',
      // Force rehydration on mount
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth on store creation
if (typeof window !== 'undefined') {
  useAuthStore.getState().initializeAuth();
}

export default useAuthStore;
