import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, LayoutDashboard, Wand2, User as UserIcon, LogOut } from 'lucide-react';
import { useAuthStore } from '../store';

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const { user, token, logout, fetchWithAuth, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Refresh profile details on mount
    const fetchProfile = async () => {
      try {
        const res = await fetchWithAuth('/users/me');
        if (res.ok) {
          const freshUser = await res.json();
          updateUser(freshUser);
        }
      } catch (e) {
        console.error('Failed to update profile info:', e);
      }
    };

    fetchProfile();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  // Plan badge styling helper
  const getBadgeClass = (tier: string) => {
    if (tier === 'pro') return 'badge-pro';
    if (tier === 'enterprise') return 'badge-enterprise';
    return 'badge-free';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header className="glass-panel" style={{
        margin: '20px 20px 10px',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Brand logo */}
        <Link to="/app/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px var(--accent-primary)'
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 700,
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AvatarIA
          </span>
        </Link>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link
            to="/app/dashboard"
            className="btn"
            style={{
              background: isActive('/app/dashboard') ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: isActive('/app/dashboard') ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              border: isActive('/app/dashboard') ? '1px solid var(--border-color)' : 'none',
              padding: '8px 16px',
              fontSize: '0.9rem'
            }}
          >
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          
          <Link
            to="/app/generate"
            className="btn"
            style={{
              background: isActive('/app/generate') ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: isActive('/app/generate') ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              border: isActive('/app/generate') ? '1px solid var(--border-color)' : 'none',
              padding: '8px 16px',
              fontSize: '0.9rem'
            }}
          >
            <Wand2 size={16} /> Generar Avatar
          </Link>
          
          <Link
            to="/app/profile"
            className="btn"
            style={{
              background: isActive('/app/profile') ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: isActive('/app/profile') ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              border: isActive('/app/profile') ? '1px solid var(--border-color)' : 'none',
              padding: '8px 16px',
              fontSize: '0.9rem'
            }}
          >
            <UserIcon size={16} /> Mi Perfil
          </Link>
        </nav>

        {/* User Info & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {user.display_name || user.email.split('@')[0]}
              </span>
              <span className={`badge ${getBadgeClass(user.plan_tier)}`}>
                {user.plan_tier}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Créditos: {user.credits_limit - user.credits_used} / {user.credits_limit} libres
            </span>
          </div>

          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px', borderRadius: '8px' }} title="Cerrar Sesión">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '10px 20px 40px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
