import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isDevMode: boolean;
  isLoading: boolean;
  loginDevMode: (name?: string, email?: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const DEV_USER: User = {
  id: 'dev-user-001',
  email: 'developer@moduleforge.io',
  name: 'Dev Architect',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  isDev: true,
};

export const useAuthStore = create<AuthState>((set) => ({
  user: DEV_USER, // Default to Dev User for seamless local development
  isAuthenticated: true,
  isDevMode: true,
  isLoading: false,

  loginDevMode: (name = 'Dev Architect', email = 'developer@moduleforge.io') => {
    const user: User = {
      id: `dev-${Date.now()}`,
      email,
      name,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isDev: true,
    };
    localStorage.setItem('moduleforge_dev_user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isDevMode: true });
  },

  logout: () => {
    localStorage.removeItem('moduleforge_dev_user');
    set({ user: null, isAuthenticated: false, isDevMode: false });
  },

  checkAuth: async () => {
    const saved = localStorage.getItem('moduleforge_dev_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        set({ user, isAuthenticated: true, isDevMode: true, isLoading: false });
        return;
      } catch (e) {
        // ignore
      }
    }
    // Default fallback to dev user
    set({ user: DEV_USER, isAuthenticated: true, isDevMode: true, isLoading: false });
  },
}));
