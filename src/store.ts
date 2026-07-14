import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  plan_tier: 'free' | 'pro' | 'enterprise';
  credits_used: number;
  credits_limit: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  apiBase: string;
  wsBase: string;
  getWsBase: () => string;
  setSession: (token: string | null, refreshToken: string | null, user: User | null) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  apiBase: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1',
  wsBase: '',
  getWsBase: () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      const url = new URL(apiUrl);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${url.host}/api/v1`;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/v1`;
  },

  setSession: (token, refreshToken, user) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');

    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    else localStorage.removeItem('refreshToken');

    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');

    set({ token, refreshToken, user });
  },

  updateUser: (updatedFields) => {
    const currentUser = get().user;
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(newUser));
      set({ user: newUser });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ token: null, refreshToken: null, user: null });
  },

  fetchWithAuth: async (url: string, options: RequestInit = {}) => {
    const { token, apiBase, logout, refreshToken } = get();
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let response = await fetch(`${apiBase}${url}`, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401 && refreshToken) {
      try {
        const refreshResponse = await fetch(`${apiBase}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          // Fetch updated user details
          const userResponse = await fetch(`${apiBase}/users/me`, {
            headers: { 'Authorization': `Bearer ${data.access_token}` }
          });
          const userData = userResponse.ok ? await userResponse.json() : get().user;
          
          // Save new session
          get().setSession(data.access_token, data.refresh_token, userData);

          // Retry the original request
          headers.set('Authorization', `Bearer ${data.access_token}`);
          response = await fetch(`${apiBase}${url}`, {
            ...options,
            headers,
          });
        } else {
          logout();
        }
      } catch (e) {
        logout();
      }
    }

    return response;
  },
}));
