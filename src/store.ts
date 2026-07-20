import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "user";
  is_active: boolean;
}

// Decodifica el `exp` (segundos epoch) de un JWT sin librería — solo se lee,
// la firma la sigue validando el backend en cada request.
function decodeExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  tokenExpiry: number | null;
  refreshTokenExpiry: number | null;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  // Sesión válida = el refresh token (7 días) no venció. El access token
  // (30 min) puede haber vencido sin que esto sea un logout — authFetch lo
  // renueva solo contra POST /auth/refresh antes de deslogueear.
  isAuthenticated: () => boolean;
  isAccessTokenExpired: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      tokenExpiry: null,
      refreshTokenExpiry: null,
      setAuth: (token, refreshToken, user) => {
        set({
          token,
          refreshToken,
          user,
          tokenExpiry: decodeExpiry(token) ?? Date.now() + 30 * 60000,
          refreshTokenExpiry: decodeExpiry(refreshToken) ?? Date.now() + 7 * 86400000,
        });
      },
      setAccessToken: (token) => {
        set({ token, tokenExpiry: decodeExpiry(token) ?? Date.now() + 30 * 60000 });
      },
      logout: () =>
        set({ token: null, refreshToken: null, user: null, tokenExpiry: null, refreshTokenExpiry: null }),
      isAuthenticated: () => {
        const { refreshToken, refreshTokenExpiry } = get();
        if (!refreshToken) return false;
        if (refreshTokenExpiry && Date.now() > refreshTokenExpiry) {
          set({ token: null, refreshToken: null, user: null, tokenExpiry: null, refreshTokenExpiry: null });
          return false;
        }
        return true;
      },
      isAccessTokenExpired: () => {
        const { tokenExpiry } = get();
        return tokenExpiry ? Date.now() > tokenExpiry : true;
      },
      isAdmin: () => get().user?.role === "admin",
    }),
    {
      name: "avatares-auth",
    }
  )
);

export type Theme = "light" | "dark";

// El script inline de index.html ya fija data-theme en <html> antes del primer paint
// (evita flash). Acá solo leemos ese valor inicial y persistimos la elección explícita.
const getInitialTheme = (): Theme => {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      toggleTheme: () => {
        const next: Theme = get().theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        set({ theme: next });
      },
      setTheme: (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        set({ theme });
      },
    }),
    {
      name: "avatares-theme",
    }
  )
);
