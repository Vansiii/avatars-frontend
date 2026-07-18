import { useState, useEffect } from "react";
import { useAuthStore } from "../store";
import { authFetch } from "../lib/api";
import { Film, Sparkles, Check, RefreshCw, Loader2, Calendar, X } from "lucide-react";
import { CharacterCardSkeleton } from "../components/Skeleton";

interface Character {
  id: string;
  name: string;
  status: string;
  reference_image_url: string | null;
}

interface Variation {
  index: number;
  video_url: string;
}

interface SpotCreated {
  spot_id: string;
  variations: Variation[];
  redos_remaining: number;
}

interface Spot {
  id: string;
  character_id: string;
  script: string;
  type: string;
  status: string;
  output_url: string | null;
  created_at: string;
}

interface Limits {
  spots_remaining: number;
}

export default function GenerateSpot() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterId, setCharacterId] = useState("");
  const [script, setScript] = useState("");
  const [type, setType] = useState<"short" | "long">("short");

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [redoing, setRedoing] = useState(false);
  const [spot, setSpot] = useState<SpotCreated | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);

  const [existingSpots, setExistingSpots] = useState<Spot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [limits, setLimits] = useState<Limits | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchCharacters();
    fetchLimits();
    fetchExistingSpots();
  }, []);

  const fetchCharacters = async () => {
    try {
      const res = await authFetch("/api/v1/characters");
      if (res.ok) {
        const data: Character[] = await res.json();
        setCharacters(data.filter((c) => c.status === "active"));
      }
    } catch {
      // Error manejado por authFetch
    } finally {
      setLoading(false);
    }
  };

  const fetchLimits = async () => {
    try {
      const res = await authFetch(`/api/v1/admin/users/${user?.id}/limits`);
      if (res.ok) {
        const data = await res.json();
        setLimits(data);
      }
    } catch {
      setLimits({ spots_remaining: 5 });
    }
  };

  const fetchExistingSpots = async () => {
    try {
      const res = await authFetch("/api/v1/spots");
      if (res.ok) {
        setExistingSpots(await res.json());
      }
    } catch {
      // Error manejado por authFetch
    } finally {
      setLoadingSpots(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!characterId) {
      setError("Seleccione un personaje");
      return;
    }
    if (script.length < 10 || script.length > 500) {
      setError("El guión debe tener entre 10 y 500 caracteres");
      return;
    }

    setCreating(true);
    try {
      const res = await authFetch("/api/v1/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_id: characterId, script, type }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al generar el spot");
      }

      const data = await res.json();
      setSpot(data);
      setSuccess("Spot generado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectVariation = async (index: number) => {
    if (!spot) return;
    setError("");

    try {
      const res = await authFetch(`/api/v1/spots/${spot.spot_id}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variation_index: index }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al seleccionar");
      }

      setSelectedVariation(index);
      setSuccess("¡Spot generado exitosamente!");

      setTimeout(() => {
        resetForm();
        fetchLimits();
        fetchExistingSpots();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleRedo = async () => {
    if (!spot) return;
    setError("");
    setRedoing(true);

    try {
      const res = await authFetch(`/api/v1/spots/${spot.spot_id}/redo`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al rehacer");
      }

      const data = await res.json();
      setSpot({
        ...spot,
        variations: data.variations,
        redos_remaining: data.redos_remaining,
      });
      setSelectedVariation(null);
      setSuccess(`3 nuevas variaciones generadas. Total: ${data.variations.length} opciones.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setRedoing(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setSpot(null);
    setSelectedVariation(null);
    setCharacterId("");
    setScript("");
    setType("short");
    setSuccess("");
    setError("");
  };

  const getVariationBatches = () => {
    if (!spot) return [];
    const batches = [];
    for (let i = 0; i < spot.variations.length; i += 3) {
      batches.push(spot.variations.slice(i, i + 3));
    }
    return batches;
  };

  const getBatchLabel = (batchIndex: number, totalBatches: number) => {
    if (batchIndex === 0) return "Opciones iniciales";
    if (batchIndex === totalBatches - 1 && totalBatches > 1) return "Últimas variaciones";
    return `Rehacer ${batchIndex}`;
  };

  // Se conoce la forma final (lista de spots) mientras se cargan los personajes
  // activos, por eso es skeleton y no un spinner genérico de página completa.
  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1><Film size={24} /> Mis Spots</h1>
        </div>
        <div className="characters-list">
          <CharacterCardSkeleton />
          <CharacterCardSkeleton />
          <CharacterCardSkeleton />
        </div>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="page">
        <div className="page-header">
          <h1><Film size={24} /> Generar Spot</h1>
        </div>
        <div className="loading-overlay">
          <Loader2 size={48} className="spin" />
          <p>Generando spot...</p>
          <p className="loading-subtitle">El render de video puede tomar 1-2 minutos</p>
        </div>
      </div>
    );
  }

  if (spot) {
    const batches = getVariationBatches();

    return (
      <div className="page">
        <div className="page-header">
          <h1>Seleccionar Variación</h1>
          <button className="btn-secondary" onClick={resetForm}>
            <X size={16} /> Cancelar
          </button>
        </div>
        <p className="section-hint">
          {spot.variations.length} opciones disponibles. Seleccione la que más le guste.
        </p>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {redoing && (
          <div className="loading-overlay">
            <Loader2 size={48} className="spin" />
            <p>Generando nuevas variaciones...</p>
            <p className="loading-subtitle">Creando 3 opciones adicionales</p>
          </div>
        )}

        {batches.map((batch, batchIndex) => (
          <div key={batchIndex} className="variation-batch">
            <h3 className="batch-title">{getBatchLabel(batchIndex, batches.length)}</h3>
            <div className="variations-grid">
              {batch.map((v) => (
                <div
                  key={v.index}
                  className={`variation-card ${selectedVariation === v.index ? "selected" : ""} ${
                    selectedVariation !== null && selectedVariation !== v.index ? "dimmed" : ""
                  }`}
                >
                  <video src={v.video_url} controls />
                  {selectedVariation === null && !redoing && (
                    <button
                      className="btn-select"
                      onClick={() => handleSelectVariation(v.index)}
                    >
                      <Check size={16} /> Seleccionar
                    </button>
                  )}
                  {selectedVariation === v.index && (
                    <div className="selected-badge">Seleccionada</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {selectedVariation === null && spot.redos_remaining > 0 && !redoing && (
          <button className="btn-secondary btn-redo" onClick={handleRedo}>
            <RefreshCw size={16} /> Rehacer ({spot.redos_remaining} restantes)
          </button>
        )}
      </div>
    );
  }

  if (showForm) {
    const canCreate = (limits?.spots_remaining ?? 5) > 0;

    return (
      <div className="page">
        <div className="page-header">
          <h1><Sparkles size={24} /> Generar Spot</h1>
          <button className="btn-secondary" onClick={resetForm}>
            <X size={16} /> Cancelar
          </button>
        </div>

        {!canCreate && (
          <div className="limit-warning">
            Ha alcanzado el límite semanal de spots (5 por semana). Espere hasta el próximo lunes.
          </div>
        )}

        {characters.length === 0 && (
          <div className="limit-warning">
            No tenés personajes activos. Creá y seleccioná uno en la sección Personajes primero.
          </div>
        )}

        <p className="section-hint">
          Genere un spot de video para uno de sus personajes.
          {limits && (
            <span className="limits-badge">
              Límite: {limits.spots_remaining} restantes esta semana
            </span>
          )}
        </p>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <form onSubmit={handleCreate} className="character-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="spot-character">Personaje *</label>
              <select
                id="spot-character"
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value)}
                required
                disabled={!canCreate || characters.length === 0}
              >
                <option value="">Seleccione...</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="spot-type">Duración *</label>
              <select
                id="spot-type"
                value={type}
                onChange={(e) => setType(e.target.value as "short" | "long")}
                required
                disabled={!canCreate}
              >
                <option value="short">Corto (3-5s)</option>
                <option value="long">Largo (15-30s)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="spot-script">Guión (10-500 caracteres) *</label>
            <textarea
              id="spot-script"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Ej: Pepito presentando los resultados del partido"
              rows={3}
              maxLength={500}
              required
              disabled={!canCreate}
            />
            <span className="char-count">{script.length}/500</span>
          </div>

          <button type="submit" className="btn-primary" disabled={!canCreate || characters.length === 0}>
            <Sparkles size={16} /> Generar Spot
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1><Film size={24} /> Mis Spots</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Sparkles size={16} /> Generar Spot
        </button>
      </div>

      {!loadingSpots && existingSpots.length === 0 && (
        <div className="empty-state">
          <Film size={48} />
          <p>No tenés spots generados todavía</p>
          <p className="empty-subtitle">Generá tu primer spot con un personaje activo</p>
        </div>
      )}

      {loadingSpots && (
        <div className="characters-list">
          <CharacterCardSkeleton />
          <CharacterCardSkeleton />
          <CharacterCardSkeleton />
        </div>
      )}

      {existingSpots.length > 0 && (
        <div className="characters-list">
          {existingSpots.map((s) => (
            <div key={s.id} className="character-card">
              <div className="character-card-image">
                {s.output_url ? (
                  <video src={s.output_url} controls />
                ) : (
                  <div className="character-card-placeholder">
                    <Film size={32} />
                  </div>
                )}
              </div>
              <div className="character-card-info">
                <h3>{s.type === "short" ? "Spot corto" : "Spot largo"}</h3>
                <p className="character-desc">{s.script.substring(0, 80)}...</p>
                <p className="character-date">
                  <Calendar size={14} /> {new Date(s.created_at).toLocaleDateString("es-AR")}
                </p>
              </div>
              <div className={`character-card-status ${s.status === "ready" ? "active" : "draft"}`}>
                {s.status === "ready" ? "Listo" : "Borrador"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
