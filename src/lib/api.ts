import { useAuthStore } from "../store";

// Deduplica refrescos concurrentes: si varias llamadas a authFetch detectan el
// access token vencido al mismo tiempo, todas esperan el mismo POST /refresh
// en vez de disparar uno cada una.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) throw new Error("No hay refresh token");

      const res = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) throw new Error("No se pudo renovar la sesión");

      const { access_token } = await res.json();
      useAuthStore.getState().setAccessToken(access_token);
      return access_token as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function forceLogout(): never {
  useAuthStore.getState().logout();
  window.location.href = "/login";
  throw new Error("Sesión expirada");
}

/**
 * Wrapper para fetch que maneja expiración de token.
 *
 * El access token dura poco (30 min) a propósito — si vence, se renueva
 * solo contra /auth/refresh usando el refresh token (7 días) antes de la
 * request, o después de un 401, en vez de deslogueear de una. Solo se
 * fuerza logout si el refresh token también venció o el refresh falla.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (!useAuthStore.getState().isAuthenticated()) {
    forceLogout();
  }

  let token = useAuthStore.getState().token;
  if (useAuthStore.getState().isAccessTokenExpired()) {
    try {
      token = await refreshAccessToken();
    } catch {
      forceLogout();
    }
  }

  const buildHeaders = (t: string | null) => ({
    ...options.headers,
    Authorization: `Bearer ${t}`,
  });

  let response = await fetch(url, { ...options, headers: buildHeaders(token) });

  if (response.status === 401) {
    // El backend rechazó el access token (p. ej. venció justo entre el chequeo
    // de arriba y esta request) — un solo reintento tras renovar, no un loop.
    try {
      token = await refreshAccessToken();
    } catch {
      forceLogout();
    }
    response = await fetch(url, { ...options, headers: buildHeaders(token) });
    if (response.status === 401) {
      forceLogout();
    }
  }

  return response;
}
