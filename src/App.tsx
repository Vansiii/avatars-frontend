import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Characters from "./pages/Characters";
import GenerateSpot from "./pages/GenerateSpot";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import DashboardLayout from "./components/DashboardLayout";

const queryClient = new QueryClient();

// Páginas públicas que no requieren autenticación
const PUBLIC_PATHS = ["/", "/login"];

// Componente que verifica expiración del token
function AuthChecker({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const isPublicPage = PUBLIC_PATHS.includes(location.pathname);

  useEffect(() => {
    // No verificar en páginas públicas
    if (isPublicPage) return;

    // Verificar al montar
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Verificar cada 30 segundos
    const interval = setInterval(() => {
      if (!isAuthenticated()) {
        logout();
        navigate("/login");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout, navigate, isPublicPage]);

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  return isAdmin ? <>{children}</> : <Navigate to="/app/dashboard" />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthChecker>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="characters" element={<Characters />} />
              <Route path="spots" element={<GenerateSpot />} />
              <Route path="profile" element={<Profile />} />
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
            </Route>
          </Routes>
        </AuthChecker>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
