import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Loader2, Save, Trash2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store';

export default function Profile() {
  const { user, fetchWithAuth, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();

  // Form states
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  // Operation states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Danger Zone deletion states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetchWithAuth('/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName || null,
          bio: bio || null,
          avatar_url: avatarUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Error al actualizar el perfil');
      }

      updateUser(data);
      setSuccess('Perfil actualizado correctamente.');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR MI CUENTA') {
      setError('Por favor escribe la frase de confirmación exacta.');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await fetchWithAuth('/users/me', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Error al eliminar la cuenta');
      }

      logout();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al eliminar tu cuenta');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', textAlign: 'left' }} className="grid-cols-2">
      
      {/* Left Column: Profile Settings Form */}
      <div className="glass-panel" style={{ padding: '40px' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '24px' }}>Configuración del Perfil</h2>

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#34D399',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#FF6B6B',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="display-name">Nombre de Mostrar</label>
            <input
              id="display-name"
              type="text"
              placeholder="Ej: John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="avatar-url">URL del Avatar (Opcional)</label>
            <input
              id="avatar-url"
              type="text"
              placeholder="https://ejemplo.com/foto.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label htmlFor="bio-input">Biografía o Notas</label>
            <textarea
              id="bio-input"
              rows={4}
              placeholder="Escribe algo sobre ti..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '12px 24px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spinner" /> Guardando...
              </>
            ) : (
              <>
                <Save size={16} /> Guardar Cambios
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Account Status & Danger Zone */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Plan & Credits Summary Panel */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Estado de la Cuenta</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Plan Actual</span>
              <span className="badge badge-pro">{user.plan_tier}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Créditos Utilizados</span>
              <span style={{ fontWeight: 600 }}>{user.credits_used} / {user.credits_limit}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Miembro desde</span>
              <span style={{ fontWeight: 500 }}>{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-panel" style={{ padding: '30px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.02)' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#FF6B6B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} /> Zona de Peligro
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
            Al eliminar tu cuenta, se borrarán de forma definitiva tu perfil, tu historial de avatares generados y todas tus imágenes guardadas. Esta acción no se puede deshacer.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger"
              style={{ width: '100%' }}
            >
              <Trash2 size={16} /> Eliminar Cuenta
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '0.8rem', color: '#FF6B6B', fontWeight: 600 }}>
                Escribe "ELIMINAR MI CUENTA" para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Escribe la confirmación"
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDeleteAccount}
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={deleting}
                >
                  {deleting ? 'Eliminando...' : 'Confirmar'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={deleting}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
