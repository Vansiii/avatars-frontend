import { useState, useEffect } from "react";
import { useAuthStore } from "../store";
import { authFetch } from "../lib/api";
import { Image, Sparkles, Check, RefreshCw, Loader2, User, Calendar, Plus, X } from "lucide-react";
import { CharacterCardSkeleton } from "../components/Skeleton";

interface Category {
  id: string;
  name: string;
}

interface Variation {
  index: number;
  image_url: string;
}

interface CharacterCreated {
  character_id: string;
  variations: Variation[];
  redos_remaining: number;
}

interface Character {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  reference_image_url: string | null;
  generated_image_url: string | null;
  created_at: string;
}

interface Limits {
  characters_remaining: number;
}

// Opciones guiadas para precisar la apariencia del personaje en el prompt de generación.
// Se combinan en una sola descripción — no requieren cambios de schema/backend.
const GENDER_OPTIONS = ["Masculino", "Femenino", "No binario"];
const AGE_OPTIONS = ["20-30 años", "30-45 años", "45-60 años", "60+ años"];
const SKIN_TONE_OPTIONS = ["clara", "media", "morena", "oscura"];
const HAIR_OPTIONS = [
  "corto y oscuro",
  "corto y claro",
  "largo y oscuro",
  "largo y claro",
  "rizado",
  "canoso",
  "calvo",
];
const ATTIRE_OPTIONS = [
  "traje formal de noticiero",
  "business casual",
  "atuendo deportivo",
  "elegante de gala",
  "casual moderno",
];
// Mapea directo al uso: spots de noticias (formal) vs contenido de valor (cercano/dinámico)
const PRESENTATION_OPTIONS = [
  "formal y profesional, como presentador de noticias",
  "cercano y carismático, como creador de contenido",
  "enérgico y dinámico",
  "serio y autoritario",
];

export default function Characters() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [skinTone, setSkinTone] = useState("");
  const [hairStyle, setHairStyle] = useState("");
  const [attire, setAttire] = useState("");
  const [presentationStyle, setPresentationStyle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [redoing, setRedoing] = useState(false);
  const [character, setCharacter] = useState<CharacterCreated | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const [existingCharacters, setExistingCharacters] = useState<Character[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [limits, setLimits] = useState<Limits | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchCategories();
    fetchLimits();
    fetchExistingCharacters();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/v1/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch {
      setCategories([
        { id: "1", name: "Deportes" },
        { id: "2", name: "Noticias" },
        { id: "3", name: "Entretenimiento" },
      ]);
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
      setLimits({ characters_remaining: 2 });
    }
  };

  const fetchExistingCharacters = async () => {
    try {
      const res = await authFetch("/api/v1/characters");
      if (res.ok) {
        const data = await res.json();
        setExistingCharacters(data);
      }
    } catch {
      // Error manejado por authFetch
    } finally {
      setLoadingCharacters(false);
    }
  };

  // Combina las opciones guiadas + texto libre en una sola descripción para el prompt.
  const composeDescription = () => {
    const parts: string[] = [];
    if (gender) parts.push(gender.toLowerCase());
    if (ageRange) parts.push(`de ${ageRange}`);
    if (skinTone) parts.push(`piel ${skinTone}`);
    if (hairStyle) parts.push(`cabello ${hairStyle}`);
    if (attire) parts.push(`vistiendo ${attire}`);
    if (presentationStyle) parts.push(`actitud ${presentationStyle}`);
    const structured = parts.join(", ");
    return [structured, description.trim()].filter(Boolean).join(". ").slice(0, 500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("La imagen no puede superar 10 MB");
        return;
      }
      const validFormats = ["image/jpeg", "image/png", "image/webp"];
      if (!validFormats.includes(file.type)) {
        setError("Formato no soportado. Use JPEG, PNG o WEBP");
        return;
      }
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoadedImages(new Set());

    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!selectedCategory) {
      setError("Seleccione una categoría");
      return;
    }

    const finalDescription = composeDescription();
    if (!selectedFile && !finalDescription) {
      setError("Suba una imagen de referencia o describa la apariencia del personaje");
      return;
    }
    if (finalDescription && finalDescription.length < 10) {
      setError("Agregue más detalles de apariencia (mínimo 10 caracteres)");
      return;
    }

    setCreating(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", selectedCategory);
      if (finalDescription) formData.append("description", finalDescription);
      if (selectedFile) formData.append("file", selectedFile);

      const res = await authFetch("/api/v1/characters", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al crear personaje");
      }

      const data = await res.json();
      setCharacter(data);
      setSuccess("Personaje creado. Las imágenes se están cargando...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectVariation = async (index: number) => {
    if (!character) return;
    setError("");

    try {
      const res = await authFetch(`/api/v1/characters/${character.character_id}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variation_index: index }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al seleccionar");
      }

      setSelectedVariation(index);
      setSuccess("¡Personaje creado exitosamente!");

      setTimeout(() => {
        setCharacter(null);
        setSelectedVariation(null);
        resetForm();
        fetchLimits();
        fetchExistingCharacters();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleRedo = async () => {
    if (!character) return;
    setError("");
    setRedoing(true);
    setLoadedImages(new Set());

    try {
      const res = await authFetch(`/api/v1/characters/${character.character_id}/redo`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al rehacer");
      }

      const data = await res.json();
      setCharacter({
        ...character,
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

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  };

  const resetForm = () => {
    setShowForm(false);
    setCharacter(null);
    setSelectedVariation(null);
    setName("");
    setDescription("");
    setGender("");
    setAgeRange("");
    setSkinTone("");
    setHairStyle("");
    setAttire("");
    setPresentationStyle("");
    setSelectedCategory("");
    setSelectedFile(null);
    setPreview(null);
    setSuccess("");
    setError("");
    setLoadedImages(new Set());
  };

  const getVariationBatches = () => {
    if (!character) return [];
    const batches = [];
    for (let i = 0; i < character.variations.length; i += 3) {
      batches.push(character.variations.slice(i, i + 3));
    }
    return batches;
  };

  const getBatchLabel = (batchIndex: number, totalBatches: number) => {
    if (batchIndex === 0) return "Opciones iniciales";
    if (batchIndex === totalBatches - 1 && totalBatches > 1) return "Últimas variaciones";
    return `Rehacer ${batchIndex}`;
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      deportes: "Deportes",
      noticias: "Noticias",
      entretenimiento: "Entretenimiento",
    };
    return labels[cat] || cat;
  };

  // Se conoce la forma final (lista de tarjetas de personaje) mientras se cargan
  // categorías, por eso es skeleton y no un spinner genérico de página completa.
  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1><User size={24} /> Mis Personajes</h1>
        </div>
        <div className="characters-list">
          <CharacterCardSkeleton />
          <CharacterCardSkeleton />
          <CharacterCardSkeleton />
        </div>
      </div>
    );
  }

  // Vista de creación con loading
  if (creating) {
    return (
      <div className="page">
        <div className="page-header">
          <h1><Sparkles size={24} /> Crear Personaje</h1>
        </div>
        <div className="loading-overlay">
          <Loader2 size={48} className="spin" />
          <p>Generando personaje...</p>
          <p className="loading-subtitle">Esto puede tomar unos segundos</p>
        </div>
      </div>
    );
  }

  // Vista de variaciones
  if (character) {
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
          {character.variations.length} opciones disponibles. Seleccione la que más le guste.
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
                  {!loadedImages.has(v.index) && (
                    <div className="image-loading skeleton" />
                  )}
                  <img
                    src={v.image_url}
                    alt={`Variación ${v.index + 1}`}
                    onLoad={() => handleImageLoad(v.index)}
                    style={{ display: loadedImages.has(v.index) ? "block" : "none" }}
                  />
                  {selectedVariation === null && !redoing && loadedImages.has(v.index) && (
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

        {selectedVariation === null && character.redos_remaining > 0 && !redoing && (
          <button className="btn-secondary btn-redo" onClick={handleRedo}>
            <RefreshCw size={16} /> Rehacer ({character.redos_remaining} restantes)
          </button>
        )}
      </div>
    );
  }

  // Vista de formulario de creación
  if (showForm) {
    const canCreate = (limits?.characters_remaining ?? 2) > 0;

    return (
      <div className="page">
        <div className="page-header">
          <h1><Sparkles size={24} /> Crear Personaje</h1>
          <button className="btn-secondary" onClick={resetForm}>
            <X size={16} /> Cancelar
          </button>
        </div>

        {!canCreate && (
          <div className="limit-warning">
            Ha alcanzado el límite semanal de personajes (2 por semana). Espere hasta el próximo lunes.
          </div>
        )}

        <p className="section-hint">
          Cree un personaje hiperrealista para sus spots publicitarios.
          {limits && (
            <span className="limits-badge">
              Límite: {limits.characters_remaining} restantes esta semana
            </span>
          )}
        </p>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <form onSubmit={handleCreate} className="character-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="char-name">Nombre del personaje *</label>
              <input
                id="char-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Carlos Deportes"
                required
                disabled={!canCreate}
              />
            </div>

            <div className="form-group">
              <label htmlFor="char-category">Categoría *</label>
              <select
                id="char-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                required
                disabled={!canCreate}
              >
                <option value="">Seleccione...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name.toLowerCase()}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="section-hint">
            Precise la apariencia y el estilo de presentación — se usa para generar el personaje
            y define si luce como presentador de noticias o creador de contenido.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="char-gender">Género</label>
              <select
                id="char-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={!canCreate}
              >
                <option value="">Sin especificar</option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="char-age">Edad aparente</label>
              <select
                id="char-age"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                disabled={!canCreate}
              >
                <option value="">Sin especificar</option>
                {AGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="char-skin">Tono de piel</label>
              <select
                id="char-skin"
                value={skinTone}
                onChange={(e) => setSkinTone(e.target.value)}
                disabled={!canCreate}
              >
                <option value="">Sin especificar</option>
                {SKIN_TONE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="char-hair">Cabello</label>
              <select
                id="char-hair"
                value={hairStyle}
                onChange={(e) => setHairStyle(e.target.value)}
                disabled={!canCreate}
              >
                <option value="">Sin especificar</option>
                {HAIR_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="char-attire">Vestimenta</label>
              <select
                id="char-attire"
                value={attire}
                onChange={(e) => setAttire(e.target.value)}
                disabled={!canCreate}
              >
                <option value="">Sin especificar</option>
                {ATTIRE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="char-presentation">Estilo de presentación</label>
              <select
                id="char-presentation"
                value={presentationStyle}
                onChange={(e) => setPresentationStyle(e.target.value)}
                disabled={!canCreate}
              >
                <option value="">Sin especificar</option>
                {PRESENTATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="char-desc">Detalles adicionales (opcional)</label>
            <textarea
              id="char-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: lentes, barba, cicatriz, colores de marca, personalidad..."
              rows={3}
              maxLength={500}
              disabled={!canCreate}
            />
            <span className="char-count">{description.length}/500</span>
          </div>

          <div className="form-group">
            <label htmlFor="char-image">
              <Image size={16} /> Imagen de referencia (opcional si describe la apariencia)
            </label>
            <input
              id="char-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={!canCreate}
            />
            <span className="file-hint">JPEG, PNG o WEBP. Máximo 10 MB.</span>
          </div>

          {preview && (
            <div className="image-preview">
              <img src={preview} alt="Vista previa" />
            </div>
          )}

          {composeDescription() && (
            <div className="form-group">
              <label>Vista previa de la descripción generada</label>
              <p className="section-hint">{composeDescription()}</p>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={!canCreate}>
            <Sparkles size={16} /> Crear Personaje
          </button>
        </form>
      </div>
    );
  }

  // Vista principal: lista de personajes
  return (
    <div className="page">
      <div className="page-header">
        <h1><User size={24} /> Mis Personajes</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Crear Personaje
        </button>
      </div>

      {!loadingCharacters && existingCharacters.length === 0 && (
        <div className="empty-state">
          <User size={48} />
          <p>No tenés personajes creados todavía</p>
          <p className="empty-subtitle">Creá tu primer personaje para empezar a generar spots</p>
        </div>
      )}

      {loadingCharacters && (
        <div className="characters-list">
          <CharacterCardSkeleton />
          <CharacterCardSkeleton />
          <CharacterCardSkeleton />
        </div>
      )}

      {existingCharacters.length > 0 && (
        <div className="characters-list">
          {existingCharacters.map((char) => (
            <div key={char.id} className="character-card">
              <div className="character-card-image">
                {char.generated_image_url || char.reference_image_url ? (
                  <img
                    src={char.generated_image_url || char.reference_image_url || ""}
                    alt={char.name}
                  />
                ) : (
                  <div className="character-card-placeholder">
                    <User size={32} />
                  </div>
                )}
              </div>
              <div className="character-card-info">
                <h3>{char.name}</h3>
                <p className="character-category">{getCategoryLabel(char.category)}</p>
                {char.description && (
                  <p className="character-desc">{char.description.substring(0, 80)}...</p>
                )}
                <p className="character-date">
                  <Calendar size={14} /> {new Date(char.created_at).toLocaleDateString("es-AR")}
                </p>
              </div>
              <div className={`character-card-status ${char.status}`}>
                {char.status === "active" ? "Activo" : "Borrador"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
