import { useState, useEffect } from "react";
import { useAuthStore } from "../store";
import { authFetch } from "../lib/api";
import { Link } from "react-router-dom";
import { Film, Sparkles } from "lucide-react";

interface Limits {
  characters_used: number;
  characters_limit: number;
  characters_remaining: number;
  spots_used: number;
  spots_limit: number;
  spots_remaining: number;
}

function LimitCard({
  icon,
  title,
  used,
  limit,
  remaining,
  label,
}: {
  icon: React.ReactNode;
  title: string;
  used: number;
  limit: number;
  remaining: number;
  label: string;
}) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className="card">
      <h3>{icon} {title}</h3>
      <p className="card-value">{used}</p>
      <p className="card-label">{label}</p>
      <div className="card-progress">
        <div className="card-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="card-limit">{remaining} restantes de {limit}</p>
    </div>
  );
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [limits, setLimits] = useState<Limits | null>(null);

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const res = await authFetch(`/api/v1/admin/users/${user?.id}/limits`);
      if (res.ok) {
        const data = await res.json();
        setLimits(data);
      }
    } catch {
      // Usar límites por defecto si falla
      setLimits({
        characters_used: 0,
        characters_limit: 2,
        characters_remaining: 2,
        spots_used: 0,
        spots_limit: 5,
        spots_remaining: 5,
      });
    }
  };

  return (
    <div className="page">
      <h1>Bienvenido, {user?.display_name}</h1>

      <div className="dashboard-cards">
        <LimitCard
          icon={<Sparkles size={16} />}
          title="Personajes"
          used={limits?.characters_used ?? 0}
          limit={limits?.characters_limit ?? 2}
          remaining={limits?.characters_remaining ?? 2}
          label="creados esta semana"
        />
        <LimitCard
          icon={<Film size={16} />}
          title="Spots"
          used={limits?.spots_used ?? 0}
          limit={limits?.spots_limit ?? 5}
          remaining={limits?.spots_remaining ?? 5}
          label="generados esta semana"
        />
      </div>

      <div className="dashboard-actions">
        <Link to="/app/characters" className="btn-primary">
          <Sparkles size={16} /> Crear Personaje
        </Link>
        <Link to="/app/spots" className="btn-secondary">
          <Film size={16} /> Generar Spot
        </Link>
      </div>
    </div>
  );
}
