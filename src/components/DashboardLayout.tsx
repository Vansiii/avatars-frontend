import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store";
import { LayoutDashboard, Users, Film, UserCircle, ShieldCheck, Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  // El sidebar es off-canvas en mobile; en desktop este estado no aplica (CSS lo fija visible)
  const [menuOpen, setMenuOpen] = useState(false);

  // Cerrar el menú al navegar: en mobile el sidebar tapa el contenido, quedaría abierto sobre la nueva página
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/app/characters", label: "Personajes", icon: Users },
    { path: "/app/spots", label: "Spots", icon: Film },
    { path: "/app/profile", label: "Mi Perfil", icon: UserCircle },
  ];

  if (user?.role === "admin") {
    navItems.push({ path: "/app/admin", label: "Admin", icon: ShieldCheck });
  }

  const initial = user?.display_name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="layout">
      {/* Barra superior solo-mobile: hamburguesa para abrir el sidebar off-canvas */}
      <header className="mobile-topbar">
        <button
          className="hamburger"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <Menu size={22} />
        </button>
        <span className="brand-name"><span className="brand-tv">TV</span><span className="brand-u">U</span> Studio</span>
        <ThemeToggle />
      </header>

      {/* Fondo oscuro que cierra el menú al tocar fuera (solo visible con menú abierto en mobile) */}
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header sidebar-brand">
          <button
            className="sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
          <div className="brand-logos">
            <span className="brand-logo-chip brand-logo-chip--tvu">
              <img src="/logo-tvu.jpg" alt="Canal 11 TVU" />
            </span>
            <span className="brand-logo-chip brand-logo-chip--uagrm">
              <img src="/logo-uagrm.jpg" alt="UAGRM" />
            </span>
          </div>
          <span className="brand-name"><span className="brand-tv">TV</span><span className="brand-u">U</span> Studio</span>
          <span className="brand-subtitle">Canal 11 · UAGRM</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={location.pathname === item.path ? "active" : ""}
              >
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-avatar">{initial}</span>
            <p className="user-name">{user?.display_name}</p>
          </div>
          <div className="sidebar-footer-actions">
            <button onClick={logout} className="btn-logout">
              Cerrar sesión
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
