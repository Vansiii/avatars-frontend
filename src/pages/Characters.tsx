import { useState, useEffect, useRef } from "react";
import { authFetch } from "../lib/api";
import { Image, Sparkles, Check, Loader2, User, Calendar, Plus, X, Volume2, Play, Pause, Grid, Upload } from "lucide-react";
import { CharacterCardSkeleton } from "../components/Skeleton";

interface Category {
  id: string;
  name: string;
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
  heygen_voice_id: string | null;
  heygen_voice_name: string | null;
}

interface HeygenVoice {
  voice_id: string;
  name: string;
  gender: string | null;
  preview_audio_url: string | null;
}

interface PhotoResult {
  avatar_id: string;
  avatar_group_id: string;
  preview_image_url: string;
}

interface CatalogAvatar {
  avatar_id: string;
  avatar_group_id: string;
  name: string;
  preview_image_url: string | null;
  gender: string | null;
}

type CreationMode = "photo" | "catalog" | null;

export default function Characters() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [creationMode, setCreationMode] = useState<CreationMode>(null);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [photoResult, setPhotoResult] = useState<PhotoResult | null>(null);

  const [catalog, setCatalog] = useState<CatalogAvatar[]>([]);
  const [catalogNextToken, setCatalogNextToken] = useState<string | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [existingCharacters, setExistingCharacters] = useState<Character[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);

  const [voicePickerCharacter, setVoicePickerCharacter] = useState<Character | null>(null);
  const [voices, setVoices] = useState<HeygenVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [savingVoiceId, setSavingVoiceId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  // Un solo <audio> compartido entre todas las filas: al tocar "play" en otra
  // voz se corta la que estaba sonando, en vez de superponerse.
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCategories();
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

  const handleOpenVoicePicker = async (char: Character) => {
    setVoicePickerCharacter(char);
    setError("");
    // El catálogo de voces no cambia entre aperturas, se pide una sola vez por sesión.
    if (voices.length > 0) return;
    setLoadingVoices(true);
    try {
      const res = await authFetch("/api/v1/characters/heygen-voices");
      if (!res.ok) throw new Error("Error al cargar las voces");
      setVoices(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar las voces");
    } finally {
      setLoadingVoices(false);
    }
  };

  const handlePlayPreview = (voice: HeygenVoice) => {
    const audio = previewAudioRef.current;
    if (!audio || !voice.preview_audio_url) return;

    if (playingVoiceId === voice.voice_id) {
      audio.pause();
      setPlayingVoiceId(null);
      return;
    }

    audio.src = `/api/v1/characters/voice-preview?url=${encodeURIComponent(voice.preview_audio_url)}`;
    audio.play();
    setPlayingVoiceId(voice.voice_id);
  };

  const closeVoicePicker = () => {
    previewAudioRef.current?.pause();
    setPlayingVoiceId(null);
    setVoicePickerCharacter(null);
  };

  const handleSelectVoice = async (voice: HeygenVoice) => {
    if (!voicePickerCharacter) return;
    setSavingVoiceId(voice.voice_id);
    try {
      const res = await authFetch(`/api/v1/characters/${voicePickerCharacter.id}/voice`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice_id: voice.voice_id, voice_name: voice.name }),
      });
      if (!res.ok) throw new Error("Error al guardar la voz");
      const updated = await res.json();
      setExistingCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setVoicePickerCharacter(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la voz");
    } finally {
      setSavingVoiceId(null);
    }
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

  const validateNameAndCategory = () => {
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return false;
    }
    if (!selectedCategory) {
      setError("Seleccione una categoría");
      return false;
    }
    return true;
  };

  const handleCreateFromPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validateNameAndCategory()) return;
    if (!selectedFile) {
      setError("Suba una foto");
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", selectedCategory);
      formData.append("file", selectedFile);

      const res = await authFetch("/api/v1/characters/create-from-photo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al crear el avatar");
      }

      setPhotoResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCreating(false);
    }
  };

  const confirmCharacter = async (avatar: PhotoResult) => {
    setError("");
    setConfirming(true);
    try {
      const res = await authFetch("/api/v1/characters/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category: selectedCategory,
          avatar_id: avatar.avatar_id,
          avatar_group_id: avatar.avatar_group_id,
          preview_image_url: avatar.preview_image_url,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al confirmar el personaje");
      }
      setSuccess("¡Personaje creado exitosamente!");
      setTimeout(() => {
        resetForm();
        fetchExistingCharacters();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setConfirming(false);
    }
  };

  const discardPhotoResult = () => {
    setPhotoResult(null);
    setSelectedFile(null);
    setPreview(null);
  };

  const fetchCatalogPage = async (token: string | null) => {
    setLoadingCatalog(true);
    setError("");
    try {
      const url = token
        ? `/api/v1/characters/heygen-catalog?token=${encodeURIComponent(token)}`
        : "/api/v1/characters/heygen-catalog";
      const res = await authFetch(url);
      if (!res.ok) throw new Error("Error al cargar el catálogo de HeyGen");
      const data = await res.json();
      setCatalog((prev) => (token ? [...prev, ...data.items] : data.items));
      setCatalogNextToken(data.next_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const openCatalogMode = () => {
    setCreationMode("catalog");
    if (catalog.length === 0) fetchCatalogPage(null);
  };

  const handlePickFromCatalog = async (avatar: CatalogAvatar) => {
    setError("");
    if (!validateNameAndCategory()) return;
    if (!avatar.preview_image_url) return;
    await confirmCharacter({
      avatar_id: avatar.avatar_id,
      avatar_group_id: avatar.avatar_group_id,
      preview_image_url: avatar.preview_image_url,
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setCreationMode(null);
    setPhotoResult(null);
    setName("");
    setSelectedCategory("");
    setSelectedFile(null);
    setPreview(null);
    setSuccess("");
    setError("");
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

  if (creating) {
    return (
      <div className="page">
        <div className="page-header">
          <h1><Sparkles size={24} /> Crear Personaje</h1>
        </div>
        <div className="loading-overlay">
          <Loader2 size={48} className="spin" />
          <p>Creando avatar en HeyGen...</p>
          <p className="loading-subtitle">Puede tardar hasta 2 minutos</p>
        </div>
      </div>
    );
  }

  // Resultado único de "foto propia" — confirmar o descartar (no se guardó nada todavía).
  if (photoResult) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Confirmar Personaje</h1>
          <button className="btn-secondary" onClick={resetForm}>
            <X size={16} /> Cancelar
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <div className="variations-grid">
          <div className="variation-card selected">
            <img src={photoResult.preview_image_url} alt={name} />
            {!success && (
              <button className="btn-select" disabled={confirming} onClick={() => confirmCharacter(photoResult)}>
                {confirming ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Usar este personaje
              </button>
            )}
          </div>
        </div>

        {!success && (
          <button className="btn-secondary" disabled={confirming} onClick={discardPhotoResult}>
            <X size={16} /> Descartar y subir otra foto
          </button>
        )}
      </div>
    );
  }

  // Vista de formulario de creación
  if (showForm) {
    return (
      <div className="page">
        <div className="page-header">
          <h1><Sparkles size={24} /> Crear Personaje</h1>
          <button className="btn-secondary" onClick={resetForm}>
            <X size={16} /> Cancelar
          </button>
        </div>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {creationMode === null && (
          <div className="creation-mode-choice">
            <button className="creation-mode-card" onClick={() => setCreationMode("photo")}>
              <Upload size={32} />
              <h3>Subir mi foto</h3>
              <p>HeyGen anima tu foto en un avatar que habla, con tu misma cara.</p>
            </button>
            <button className="creation-mode-card" onClick={openCatalogMode}>
              <Grid size={32} />
              <h3>Elegir del catálogo</h3>
              <p>Elegí un presentador ya existente del catálogo público de HeyGen.</p>
            </button>
          </div>
        )}

        {creationMode === "photo" && (
          <form onSubmit={handleCreateFromPhoto} className="character-form">
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
                />
              </div>

              <div className="form-group">
                <label htmlFor="char-category">Categoría *</label>
                <select
                  id="char-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  required
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

            <div className="form-group">
              <label htmlFor="char-image">
                <Image size={16} /> Foto *
              </label>
              <input
                id="char-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                required
              />
              <span className="file-hint">JPEG, PNG o WEBP. Máximo 10 MB. Rostro visible y de frente da mejores resultados.</span>
            </div>

            {preview && (
              <div className="image-preview">
                <img src={preview} alt="Vista previa" />
              </div>
            )}

            <button type="submit" className="btn-primary">
              <Sparkles size={16} /> Crear Avatar
            </button>
          </form>
        )}

        {creationMode === "catalog" && (
          <>
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
                />
              </div>

              <div className="form-group">
                <label htmlFor="char-category">Categoría *</label>
                <select
                  id="char-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  required
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

            <p className="section-hint">Elegí un avatar del catálogo — se usa tal cual, sin generar nada nuevo.</p>

            <div className="variations-grid">
              {catalog.map((avatar) => (
                <div key={avatar.avatar_id} className="variation-card">
                  {avatar.preview_image_url && <img src={avatar.preview_image_url} alt={avatar.name} />}
                  <button
                    className="btn-select"
                    disabled={confirming}
                    onClick={() => handlePickFromCatalog(avatar)}
                  >
                    {confirming ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Elegir "{avatar.name}"
                  </button>
                </div>
              ))}
            </div>

            {loadingCatalog && (
              <div className="inline-loading">
                <Loader2 size={20} className="spin" /> Cargando...
              </div>
            )}

            {!loadingCatalog && catalogNextToken && (
              <button className="btn-secondary" onClick={() => fetchCatalogPage(catalogNextToken)}>
                Cargar más
              </button>
            )}
          </>
        )}
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
                {char.status === "active" && (
                  <button className="btn-secondary btn-voice" onClick={() => handleOpenVoicePicker(char)}>
                    <Volume2 size={14} /> {char.heygen_voice_name || "Elegir voz"}
                  </button>
                )}
              </div>
              <div className={`character-card-status ${char.status}`}>
                {char.status === "active" ? "Activo" : "Borrador"}
              </div>
            </div>
          ))}
        </div>
      )}

      {voicePickerCharacter && (
        <div className="modal-overlay" onClick={closeVoicePicker}>
          <div className="modal modal-voices" onClick={(e) => e.stopPropagation()}>
            <h3><Volume2 size={18} /> Voz de {voicePickerCharacter.name}</h3>
            <p className="modal-subtitle">
              Se usa en todos los spots de este personaje, para que suene siempre igual.
            </p>
            {error && <p className="error">{error}</p>}

            {loadingVoices && (
              <div className="inline-loading">
                <Loader2 size={20} className="spin" /> Cargando voces...
              </div>
            )}

            {!loadingVoices && (
              <div className="voice-list">
                {voices.map((voice) => (
                  <div
                    key={voice.voice_id}
                    className={`voice-option ${voicePickerCharacter.heygen_voice_id === voice.voice_id ? "selected" : ""}`}
                  >
                    <button
                      type="button"
                      className="btn-preview"
                      disabled={!voice.preview_audio_url}
                      title={playingVoiceId === voice.voice_id ? "Detener" : "Escuchar voz"}
                      onClick={() => handlePlayPreview(voice)}
                    >
                      {playingVoiceId === voice.voice_id ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <div className="voice-option-info">
                      <strong>{voice.name}</strong>
                      {voice.gender && <span className="voice-gender">{voice.gender}</span>}
                    </div>
                    <button
                      className="btn-select"
                      disabled={savingVoiceId !== null}
                      onClick={() => handleSelectVoice(voice)}
                    >
                      {savingVoiceId === voice.voice_id ? (
                        <Loader2 size={14} className="spin" />
                      ) : voicePickerCharacter.heygen_voice_id === voice.voice_id ? (
                        <Check size={14} />
                      ) : null}
                      Usar esta voz
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Un solo reproductor oculto, reusado por todos los botones de play de arriba. */}
            <audio ref={previewAudioRef} onEnded={() => setPlayingVoiceId(null)} hidden />

            <button className="btn-secondary" onClick={closeVoicePicker}>
              <X size={16} /> Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
