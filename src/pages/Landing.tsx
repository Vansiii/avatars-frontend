import { Link } from "react-router-dom";
import { Users, Sparkles, Film, ArrowRight, ShieldCheck, RefreshCw, Layers } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

const STEPS = [
  {
    icon: Sparkles,
    title: "1. Creá el personaje",
    text: "Subí una foto y/o describilo en texto. La IA genera 3 variaciones hiperrealistas.",
  },
  {
    icon: Layers,
    title: "2. Elegí la variación",
    text: "Si ninguna convence, rehacé hasta 3 veces gratis antes de decidir.",
  },
  {
    icon: Film,
    title: "3. Generá el spot",
    text: "Con el personaje ya elegido, generá el video corto o largo para TV.",
  },
];

const FEATURES = [
  {
    icon: Users,
    title: "Personajes consistentes",
    text: "Creá un personaje una vez y usá la misma imagen de referencia en todos tus spots.",
  },
  {
    icon: Sparkles,
    title: "Generación con IA",
    text: "Imágenes hiperrealistas generadas automáticamente, con filtro de contenido en cada paso.",
  },
  {
    icon: Film,
    title: "Spots de video",
    text: "Generá videos cortos (3-5s) o largos (15-30s) listos para salir al aire.",
  },
];

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
        <div className="landing-nav-actions">
          <ThemeToggle />
          <Link to="/login" className="btn-primary">Iniciar Sesión</Link>
        </div>
      </nav>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow">Canal 11 · UAGRM</span>
            <h1>
              Personajes de TV que se ven <span className="landing-highlight">siempre igual</span>
            </h1>
            <p className="landing-description">
              Creá personajes hiperrealistas con inteligencia artificial y usalos de forma
              consistente en todos tus spots publicitarios, sin volver a diseñarlos cada vez.
            </p>
            <div className="landing-actions">
              <Link to="/login" className="btn-primary btn-lg">
                Iniciar Sesión <ArrowRight size={18} />
              </Link>
            </div>
            <ul className="landing-trust">
              <li><ShieldCheck size={16} /> Filtro NSFW automático en cada generación</li>
              <li><RefreshCw size={16} /> 3 rehacer gratis por personaje y por spot</li>
            </ul>
          </div>

          <div className="landing-hero-visual" aria-hidden="true">
            <div className="landing-mockup">
              <div className="landing-mockup-header">
                <span className="landing-mockup-dot" />
                <span className="landing-mockup-dot" />
                <span className="landing-mockup-dot" />
              </div>
              <div className="landing-mockup-avatar">
                <Sparkles size={26} />
              </div>
              <div className="landing-mockup-lines">
                <span className="landing-mockup-line landing-mockup-line--title" />
                <span className="landing-mockup-line landing-mockup-line--short" />
              </div>
              <span className="landing-mockup-badge">Personaje activo</span>
            </div>
          </div>
        </section>

        <section className="landing-steps">
          <h2>Cómo funciona</h2>
          <div className="landing-steps-grid">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div className="step" key={step.title}>
                  <div className="step-icon"><Icon size={20} /></div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="landing-features">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div className="feature" key={feature.title}>
                <div className="feature-icon-wrap">
                  <Icon size={22} className="feature-icon" />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            );
          })}
        </section>
      </main>

      <footer className="landing-footer">
        Canal 11 TVU · Universidad Autónoma Gabriel René Moreno
      </footer>
    </div>
  );
}
