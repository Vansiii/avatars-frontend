import { useAuthStore } from "../store";

/**
 * Wrapper para fetch que maneja expiración de token.
 * Si el token expira, limpia el store y redirige a login.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;
  const isAuthenticated = useAuthStore.getState().isAuthenticated;

  // Si no hay token o expiró, redirigir a login
  if (!isAuthenticated()) {
    useAuthStore.getState().logout();
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  // Agregar token al header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });

  // Si el backend retorna 401, el token expiró
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  return response;
}
