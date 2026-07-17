import { Link } from "react-router-dom";
import { Users, Sparkles, Film } from "lucide-react";

export default function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <span className="brand-name">TVU <span className="brand-accent">Studio</span></span>
        <Link to="/login" className="btn-primary">Iniciar Sesión</Link>
      </nav>
      <div className="landing-content">
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
