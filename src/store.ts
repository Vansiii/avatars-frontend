import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "user";
  is_active: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  tokenExpiry: number | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isTokenExpired: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      tokenExpiry: null,
      setAuth: (token, user) => {
        // Decodificar JWT para obtener expiración
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          set({ token, user, tokenExpiry: payload.exp * 1000 });
        } catch {
          // Si no se puede decodificar, establece expiración de 1 hora por defecto
          set({ token, user, tokenExpiry: Date.now() + 3600000 });
        }
      },
      logout: () => set({ token: null, user: null, tokenExpiry: null }),
      isAuthenticated: () => {
        const { token, tokenExpiry } = get();
        if (!token) return false;
        if (tokenExpiry && Date.now() > tokenExpiry) {
          // Token expirado, limpiar store
          set({ token: null, user: null, tokenExpiry: null });
          return false;
        }
        return true;
      },
      isTokenExpired: () => {
        const { tokenExpiry } = get();
        return tokenExpiry ? Date.now() > tokenExpiry : false;
      },
      isAdmin: () => get().user?.role === "admin",
    }),
    {
      name: "avatares-auth",
    }
  )
);
