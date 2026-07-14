import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap, Layers, ShieldCheck, Heart } from 'lucide-react';
import { useAuthStore } from '../store';

export default function Landing() {
  const { token } = useAuthStore();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header className="glass-panel" style={{
        margin: '20px',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: '20px',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px var(--accent-primary)'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.4rem',
            fontWeight: 700,
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AvatarIA
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="#features" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Características</a>
          <a href="#pricing" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Planes</a>
          {token ? (
            <Link to="/app/dashboard" className="btn btn-primary">
              Ir al Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login" style={{ color: 'var(--color-text-primary)', fontWeight: 500, padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn btn-primary">
                Registrarse
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '80px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Neon decorative background element */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '150px',
          background: 'rgba(162, 89, 255, 0.25)',
          filter: 'blur(100px)',
          borderRadius: '100px',
          zIndex: -1
        }} />

        <div className="badge badge-pro" style={{ marginBottom: '24px', padding: '6px 12px' }}>
          ✨ Nueva versión 1.0 con 13 estilos únicos
        </div>
        
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 800,
          marginBottom: '24px',
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #fff 40%, #A259FF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1
        }}>
          Crea tu Identidad Visual Digital <br />
          <span style={{ color: 'var(--accent-secondary)' }}>Impulsada por Inteligencia Artificial</span>
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          maxWidth: '800px',
          margin: '0 auto 40px',
          color: 'var(--color-text-secondary)'
        }}>
          Genera retratos profesionales, avatares gaming, stickers personalizados y personajes de videojuegos con solo subir una foto o escribir una descripción. Rápido, ultra realista y de calidad premium.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to={token ? "/app/generate" : "/register"} className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
            Comenzar Gratis <ArrowRight size={18} />
          </Link>
          <a href="#features" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
            Saber Más
          </a>
        </div>

        {/* Mockup grid showcases */}
        <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }} className="grid-cols-2">
          {[
            { img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop', name: 'Creative Professional' },
            { img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=300&fit=crop', name: 'Neon Gamer' },
            { img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop', name: 'Gradient Pop' },
            { img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop', name: 'Fantasy Hero' },
            { img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop', name: 'Corporate Portrait' },
          ].map((item, i) => (
            <div key={i} className="glass-card" style={{ padding: '8px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
              <img src={item.img} alt={item.name} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                background: 'rgba(11, 10, 15, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {item.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: '100px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
        borderTop: '1px solid var(--border-color)'
      }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '16px' }}>
          Diseñado para Creadores y Profesionales
        </h2>
        <p style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 60px' }}>
          Nuestra tecnología de vanguardia te permite generar avatares estilizados en segundos, listos para tus redes sociales, perfiles corporativos o plataformas favoritas.
        </p>

        <div className="grid-cols-3">
          <div className="glass-card" style={{ padding: '32px', textAlign: 'left' }}>
            <div style={{ background: 'rgba(162, 89, 255, 0.1)', color: 'var(--accent-primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifySelf: 'start', justifyContent: 'center', marginBottom: '20px' }}>
              <Zap size={24} />
            </div>
            <h3 style={{ marginBottom: '12px' }}>Velocidad Increíble</h3>
            <p>Obtén hasta 6 variaciones de tu avatar en menos de 15 segundos gracias a nuestra arquitectura optimizada en tiempo real.</p>
          </div>

          <div className="glass-card" style={{ padding: '32px', textAlign: 'left' }}>
            <div style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-secondary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifySelf: 'start', justifyContent: 'center', marginBottom: '20px' }}>
              <Layers size={24} />
            </div>
            <h3 style={{ marginBottom: '12px' }}>13 Estilos Únicos</h3>
            <p>Filtra y selecciona entre estilos profesionales de LinkedIn, neón cyberpunk, anime streamer, o fantasía épica medieval.</p>
          </div>

          <div className="glass-card" style={{ padding: '32px', textAlign: 'left' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifySelf: 'start', justifyContent: 'center', marginBottom: '20px' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ marginBottom: '12px' }}>Seguro y Privado</h3>
            <p>Controla tus datos de forma absoluta. Cumplimos con normativas GDPR y te permitimos exportar o eliminar tus fotos y cuenta al instante.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '30px 20px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}>
          Creado con <Heart size={14} color="var(--accent-primary)" fill="var(--accent-primary)" /> por el Equipo de Desarrollo de ProyectoIA &copy; 2026.
        </p>
      </footer>
    </div>
  );
}
