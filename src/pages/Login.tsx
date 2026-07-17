import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al iniciar sesión");
      }

      const { access_token } = await res.json();

      const userRes = await fetch("/api/v1/auth/users/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!userRes.ok) throw new Error("Error al obtener usuario");

      const user = await userRes.json();
      setAuth(access_token, user);
      navigate("/app/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-logos login-brand-logos">
          <span className="brand-logo-chip brand-logo-chip--lg">
            <img src="/logo-tvu.jpg" alt="Canal 11 TVU" />
          </span>
          <span className="brand-logo-chip brand-logo-chip--lg">
            <img src="/logo-uagrm.jpg" alt="UAGRM" />
          </span>
        </div>
        <h1 className="brand-name"><span className="brand-tv">TV</span><span className="brand-u">U</span> Studio</h1>
        <p className="brand-subtitle login-brand-subtitle">Canal 11 · UAGRM</p>
        <p className="subtitle">Personajes para Spots de TV</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
