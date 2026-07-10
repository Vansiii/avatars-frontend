import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Loader2, Check, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { apiBase } = useAuthStore();

  // Password requirement checks
  const isMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const isPasswordValid = isMinLength && hasUppercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side password validation check
    if (!isPasswordValid) {
      setError('La contraseña debe cumplir con todos los requisitos de seguridad.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al registrar usuario');
      }

      setSuccess(data.message || 'Registro exitoso.');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '40px', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--color-success)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            border: '2px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Check size={32} />
          </div>
          
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '16px' }}>¡Registro Iniciado!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', fontSize: '1rem', lineHeight: '1.6' }}>
            {success}
          </p>

          <Link to="/login" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 20px var(--accent-primary)'
          }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Crea tu cuenta</h2>
          <p style={{ fontSize: '0.95rem' }}>Regístrate para comenzar a crear avatares con IA</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#FF6B6B',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            marginBottom: '24px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Min. 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Password Validation List */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            padding: '14px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.85rem',
            textAlign: 'left'
          }}>
            <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Requisitos de la contraseña:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMinLength ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                <Check size={14} style={{ color: isMinLength ? 'var(--color-success)' : 'var(--color-text-muted)' }} />
                <span>Mínimo 8 caracteres</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasUppercase ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                <Check size={14} style={{ color: hasUppercase ? 'var(--color-success)' : 'var(--color-text-muted)' }} />
                <span>Al menos una letra mayúscula</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasNumber ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                <Check size={14} style={{ color: hasNumber ? 'var(--color-success)' : 'var(--color-text-muted)' }} />
                <span>Al menos un número</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginBottom: '24px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" /> Registrando...
              </>
            ) : (
              'Registrarse'
            )}
          </button>
        </form>

        <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
