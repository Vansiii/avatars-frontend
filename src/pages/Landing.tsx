import { Link } from "react-router-dom";
import { Users, Sparkles, Film } from "lucide-react";

export default function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="brand-logos">
          <span className="brand-logo-chip brand-logo-chip--tvu">
            <img src="/logo-tvu.jpg" alt="Canal 11 TVU" />
          </span>
          <span className="brand-logo-chip brand-logo-chip--uagrm">
            <img src="/logo-uagrm.jpg" alt="UAGRM" />
          </span>
          <span className="brand-name"><span className="brand-tv">TV</span><span className="brand-u">U</span> Studio</span>
        </div>
        <Link to="/login" className="btn-primary">Iniciar Sesión</Link>
      </nav>
      <div className="landing-content">
        <div className="brand-logos landing-hero-logos">
          <span className="brand-logo-chip brand-logo-chip--lg">
            <img src="/logo-tvu.jpg" alt="Canal 11 TVU" />
          </span>
          <span className="brand-logo-chip brand-logo-chip--lg">
            <img src="/logo-uagrm.jpg" alt="UAGRM" />
          </span>
        </div>
        <p className="brand-subtitle">Canal 11 · UAGRM</p>
        <h1>Estudio de Personajes para TV</h1>
        <p className="landing-subtitle">Sistema de Personajes para Spots Publicitarios</p>
        <p className="landing-description">
          Crea personajes hiperrealistas que aparecen de forma consistente
          en múltiples videos publicitarios.
        </p>
        <div className="landing-actions">
          <Link to="/login" className="btn-primary">
            Iniciar Sesión
          </Link>
        </div>
        <div className="landing-features">
          <div className="feature">
            <Users size={22} className="feature-icon" />
            <h3>Personajes Consistentes</h3>
            <p>Crea un personaje una vez y úsalo en todos tus spots.</p>
          </div>
          <div className="feature">
            <Sparkles size={22} className="feature-icon" />
            <h3>Generación con IA</h3>
            <p>Imágenes hiperrealistas generadas con inteligencia artificial.</p>
          </div>
          <div className="feature">
            <Film size={22} className="feature-icon" />
            <h3>Spots de Video</h3>
            <p>Genera videos cortos y largos para televisión.</p>
          </div>
        </div>
        <footer className="landing-footer">
          Canal 11 TVU · Universidad Autónoma Gabriel René Moreno
        </footer>
      </div>
    </div>
  );
}
