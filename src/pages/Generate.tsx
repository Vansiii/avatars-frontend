import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Type, Grid, Sliders, Sparkles, AlertCircle, Loader2, Lock, Check, Download, Maximize2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store';
import CreditsDisplay from '../components/CreditsDisplay';
import ErrorDisplay from '../components/ErrorDisplay';
import { extractErrorCode } from '../utils/errorMessages';

interface Style {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  preview_url: string | null;
  example_urls: string[];
  tier_required: 'free' | 'pro' | 'enterprise';
  tags: string[];
  sort_order: number;
}

interface GeneratedAvatar {
  id: string;
  preview_url: string;
  download_url: string;
  resolution: string;
  is_watermarked: boolean;
}

export default function Generate() {
  const navigate = useNavigate();
  const { user, token, fetchWithAuth, apiBase, getWsBase, updateUser } = useAuthStore();

  // Navigation / Steps state
  const [step, setStep] = useState(1); // 1: Input, 2: Style, 3: Options, 4: Loading, 5: Results

  // Step 1: Input state
  const [inputType, setInputType] = useState<'upload' | 'text'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');

  // Step 2: Styles state
  const [styles, setStyles] = useState<Style[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [styleFilter, setStyleFilter] = useState<string>('all');
  const [loadingStyles, setLoadingStyles] = useState(true);

  // Step 3: Options state
  const [variations, setVariations] = useState(3);
  const [notes, setNotes] = useState('');

  // Step 4: Generation / WebSocket progress state
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('Encolando tarea...');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [generatedResults, setGeneratedResults] = useState<GeneratedAvatar[]>([]);

  // Step 5: Results state
  const [selectedResult, setSelectedResult] = useState<GeneratedAvatar | null>(null);

  // General error state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load Styles on Mount
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const res = await fetchWithAuth('/styles');
        if (res.ok) {
          const data = await res.json();
          setStyles(data);
          // Set first available free style by default
          const defaultStyle = data.find((s: Style) => s.tier_required === 'free');
          if (defaultStyle) setSelectedStyle(defaultStyle);
        }
      } catch (e) {
        console.error('Failed to load styles:', e);
      } finally {
        setLoadingStyles(false);
      }
    };
    fetchStyles();
  }, []);

  // Image Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      setValidationError('El archivo debe ser un formato JPEG, PNG o WEBP.');
      return;
    }

    // Validate size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setValidationError('La imagen no puede pesar más de 10 MB.');
      return;
    }

    setFile(selectedFile);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setValidationError(null);
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(droppedFile.type)) {
      setValidationError('El archivo debe ser un formato JPEG, PNG o WEBP.');
      return;
    }

    if (droppedFile.size > 10 * 1024 * 1024) {
      setValidationError('La imagen no puede pesar más de 10 MB.');
      return;
    }

    setFile(droppedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(droppedFile);
  };

  // Submit Generation Request
  const handleStartGeneration = async () => {
    if (!selectedStyle) {
      setValidationError('Debe seleccionar un estilo.');
      return;
    }

    // Credits check
    if (user && user.credits_used >= user.credits_limit) {
      const upgradeMsg = user.plan_tier === 'free' 
        ? 'Has alcanzado tu límite mensual de 5 créditos. Actualiza a Pro para obtener 100 créditos/mes.'
        : 'Has alcanzado tu límite mensual de créditos. Los créditos se renuevan el próximo mes.';
      setValidationError(upgradeMsg);
      return;
    }

    setStep(4); // Switch to loading page
    setProgress(5);
    setProgressMsg('Creando solicitud...');
    setGenerationError(null);
    setErrorCode(undefined);

    try {
      const formData = new FormData();
      formData.append('style_id', selectedStyle.id);
      formData.append('variations', variations.toString());
      if (notes) formData.append('notes', notes);
      
      if (inputType === 'upload' && file) {
        formData.append('file', file);
      } else if (inputType === 'text' && prompt) {
        formData.append('prompt', prompt);
      } else {
        throw new Error('Debe proporcionar una imagen de entrada o una descripción.');
      }

      // API Call
      const res = await fetch(`${apiBase}/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        // Extract error code from response
        const code = extractErrorCode(res, data);
        setErrorCode(code);
        throw new Error(data.detail || 'Error al iniciar la generación');
      }

      const { request_id } = data.data;

      // Connect WebSocket
      const wsUrl = `${getWsBase()}/ws/generations/${request_id}`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connected to', wsUrl);
      };

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        
        if (msg.event === 'generation_progress') {
          setProgress(msg.data.progress);
          setProgressMsg(msg.data.message);
        } else if (msg.event === 'generation_completed') {
          setProgress(100);
          setProgressMsg('¡Completado con éxito!');
          setGeneratedResults(msg.data.avatars);
          
          // Refresh user profile credits
          updateUser({ credits_used: user!.credits_used + 1 });
          
          socket.close();
          setTimeout(() => {
            setStep(5); // Switch to results view
          }, 800);
        } else if (msg.event === 'generation_failed') {
          // Extract error code from WebSocket message
          const code = msg.data.error_code;
          if (code) setErrorCode(code);
          setGenerationError(msg.data.message || 'La generación del avatar falló.');
          socket.close();
        }
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        setGenerationError('Conexión perdida con el servidor. Por favor, intenta nuevamente.');
        setErrorCode(undefined); // Network errors don't have a GEN_ code
        socket.close();
      };

    } catch (err: any) {
      setGenerationError(err.message || 'Ocurrió un error al enviar el trabajo de generación.');
    }
  };

  const handleRestart = () => {
    setFile(null);
    setFilePreview(null);
    setPrompt('');
    setNotes('');
    setValidationError(null);
    setStep(1);
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  // Categories helper list
  const categories = [
    { slug: 'all', name: 'Todos' },
    { slug: 'professional', name: 'Profesional' },
    { slug: 'gaming', name: 'Gaming / Streamer' },
    { slug: 'social', name: 'Redes Sociales' },
    { slug: 'gaming-character', name: 'Videojuegos (Pro)' }
  ];

  // Filtering styles list
  const filteredStyles = styles.filter(s => {
    if (styleFilter === 'all') return true;
    return s.category === styleFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Wizard Header Progress Steps */}
      {step < 4 && (
        <div className="glass-panel" style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          gap: '8px'
        }}>
          {[
            { id: 1, label: 'Entrada', icon: <Upload size={16} /> },
            { id: 2, label: 'Estilo', icon: <Grid size={16} /> },
            { id: 3, label: 'Opciones', icon: <Sliders size={16} /> }
          ].map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: step === s.id ? 'var(--accent-primary)' :
                       step > s.id ? 'var(--color-success)' : 'var(--color-text-muted)',
                fontWeight: step === s.id ? 600 : 500,
                fontSize: '0.95rem',
                cursor: s.id < step ? 'pointer' : 'default'
              }}
              onClick={() => s.id < step && setStep(s.id)}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: step === s.id ? 'rgba(162, 89, 255, 0.1)' :
                            step > s.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                border: '1px solid',
                borderColor: step === s.id ? 'var(--accent-primary)' :
                             step > s.id ? 'var(--color-success)' : 'var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem'
              }}>
                {step > s.id ? <Check size={14} /> : s.id}
              </div>
              <span>{s.label}</span>
              {s.id < 3 && <span style={{ color: 'var(--border-color)', marginLeft: '12px' }}>&mdash;</span>}
            </div>
          ))}
        </div>
      )}

      {/* Validation / General errors notification block */}
      {validationError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#FF6B6B',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{validationError}</span>
        </div>
      )}

      {/* STEP 1: CHOOSE INPUT TYPE */}
      {step === 1 && (
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Elige tu método de entrada</h2>
            <p>Sube una fotografía de referencia para que la IA aplique el estilo, o descríbete con texto libre.</p>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setInputType('upload')}
              className="btn"
              style={{
                flex: 1,
                padding: '16px',
                background: inputType === 'upload' ? 'rgba(162, 89, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                border: '1px solid',
                borderColor: inputType === 'upload' ? 'var(--accent-primary)' : 'var(--border-color)',
                color: inputType === 'upload' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                flexDirection: 'column',
                height: 'auto',
                gap: '8px'
              }}
            >
              <Upload size={24} /> Subir Fotografía
            </button>
            <button
              onClick={() => setInputType('text')}
              className="btn"
              style={{
                flex: 1,
                padding: '16px',
                background: inputType === 'text' ? 'rgba(162, 89, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                border: '1px solid',
                borderColor: inputType === 'text' ? 'var(--accent-primary)' : 'var(--border-color)',
                color: inputType === 'text' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                flexDirection: 'column',
                height: 'auto',
                gap: '8px'
              }}
            >
              <Type size={24} /> Descripción Textual
            </button>
          </div>

          {inputType === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '40px 20px',
                background: 'rgba(255, 255, 255, 0.01)',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}
              onClick={() => document.getElementById('file-picker')?.click()}
            >
              <input
                id="file-picker"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              
              {filePreview ? (
                <div style={{ position: 'relative', width: '180px', height: '180px', borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={filePreview} alt="Preview de entrada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                    Cambiar
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={40} style={{ color: 'var(--color-text-muted)' }} />
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Arrastra tu foto aquí o haz clic para buscar</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>PNG, JPG o WEBP hasta 10 MB. Resol. mín. 200×200px</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="prompt-input">Describe cómo quieres tu avatar</label>
                <span style={{ fontSize: '0.8rem', color: prompt.length < 10 || prompt.length > 500 ? 'var(--color-error)' : 'var(--color-success)' }}>
                  {prompt.length}/500 caracteres (mín. 10)
                </span>
              </div>
              <textarea
                id="prompt-input"
                rows={5}
                placeholder="Ejemplo: Un hombre de unos 30 años con gafas redondas, barba corta, vistiendo una chaqueta negra, mirando al frente, iluminación cinemática suave..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={500}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              onClick={() => setStep(2)}
              className="btn btn-primary"
              disabled={inputType === 'upload' ? !file : prompt.length < 10}
            >
              Continuar al Estilo
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE STYLE */}
      {step === 2 && (
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Selecciona el estilo visual</h2>
              <p>Elige la estética y categoría que tendrá tu avatar.</p>
            </div>
            {selectedStyle && (
              <span className="badge badge-pro" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-primary)' }}>
                Seleccionado: {selectedStyle.name}
              </span>
            )}
          </div>

          {/* Filtering Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setStyleFilter(c.slug)}
                className="btn"
                style={{
                  background: styleFilter === c.slug ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid',
                  borderColor: styleFilter === c.slug ? 'var(--accent-primary)' : 'var(--border-color)',
                  color: styleFilter === c.slug ? '#fff' : 'var(--color-text-secondary)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.85rem'
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Styles Grid */}
          {loadingStyles ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Loader2 className="spinner" style={{ color: 'var(--accent-primary)' }} />
              <p style={{ marginTop: '12px' }}>Cargando catálogo de estilos...</p>
            </div>
          ) : (
            <div className="grid-cols-3">
              {filteredStyles.map((s) => {
                // Check lock condition
                const isLocked = s.tier_required === 'pro' && user?.plan_tier === 'free' ||
                                 s.tier_required === 'enterprise' && user?.plan_tier !== 'enterprise';
                const isSelected = selectedStyle?.id === s.id;

                return (
                  <div
                    key={s.id}
                    className="glass-card"
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                      boxShadow: isSelected ? '0 0 15px rgba(162, 89, 255, 0.25)' : 'none',
                      position: 'relative'
                    }}
                    onClick={() => !isLocked && setSelectedStyle(s)}
                  >
                    <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: '#151320', position: 'relative' }}>
                      <img src={s.preview_url || '/placeholder.png'} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {/* Locking Overlay */}
                      {isLocked && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(5,4,8,0.75)',
                          backdropFilter: 'blur(3px)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          color: '#FF6B6B'
                        }}>
                          <Lock size={20} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                            Requiere Plan {s.tier_required}
                          </span>
                        </div>
                      )}

                      {/* Selected Indicator Checkbox */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'var(--accent-primary)',
                          color: '#fff',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                        }}>
                          <Check size={14} />
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '16px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{s.name}</h4>
                        <span className={`badge ${s.tier_required === 'pro' ? 'badge-pro' : s.tier_required === 'enterprise' ? 'badge-enterprise' : 'badge-free'}`} style={{ fontSize: '0.65rem' }}>
                          {s.tier_required}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {s.description || 'Estilo visual premium.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <button onClick={() => setStep(1)} className="btn btn-secondary">
              Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              className="btn btn-primary"
              disabled={!selectedStyle}
            >
              Continuar a Configuración
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: OPTIONS CONFIGURATION */}
      {step === 3 && (
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Opciones adicionales de generación</h2>
            <p>Ajusta el número de variaciones y añade especificaciones adicionales.</p>
          </div>

          <div className="form-group">
            <label>Variaciones a Generar</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[3, 4, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="btn"
                  onClick={() => setVariations(num)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: variations === num ? 'rgba(162, 89, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid',
                    borderColor: variations === num ? 'var(--accent-primary)' : 'var(--border-color)',
                    color: variations === num ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontWeight: variations === num ? 600 : 500
                  }}
                >
                  {num} Variaciones
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Se generarán {variations} retratos diferentes con el mismo estilo. Solo se consumirá 1 crédito al finalizar.
            </p>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="notes-input">Notas adicionales (Opcional)</label>
              <span style={{ fontSize: '0.8rem', color: notes.length > 200 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                {notes.length}/200
              </span>
            </div>
            <input
              id="notes-input"
              type="text"
              placeholder="Ej: Con pelo más oscuro, gafas de sol, sonrisa leve..."
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
            />
          </div>

          {/* Credits Display */}
          {user && (
            <CreditsDisplay
              creditsUsed={user.credits_used}
              creditsLimit={user.credits_limit}
              planTier={user.plan_tier}
              variant="compact"
              showUpgradeButton={false}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <button onClick={() => setStep(2)} className="btn btn-secondary">
              Atrás
            </button>
            <button
              onClick={handleStartGeneration}
              className="btn btn-primary"
              style={{ background: 'var(--accent-gradient)' }}
              disabled={user && user.credits_used >= user.credits_limit}
            >
              <Sparkles size={16} /> Generar Avatar
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: LOADING SCREEN */}
      {step === 4 && (
        <div className="glass-panel" style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
          
          {generationError ? (
            <>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#FF6B6B',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(239, 68, 68, 0.3)'
              }}>
                <AlertCircle size={32} />
              </div>
              <h2 style={{ fontSize: '1.75rem' }}>Generación fallida</h2>
              
              {/* Use ErrorDisplay component for mapped error codes */}
              <div style={{ width: '100%', maxWidth: '500px' }}>
                <ErrorDisplay errorCode={errorCode} customMessage={!errorCode ? generationError : undefined} />
              </div>

              <button onClick={handleRestart} className="btn btn-primary" style={{ marginTop: '10px' }}>
                Intentar de Nuevo
              </button>
            </>
          ) : (
            <>
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                {/* Neon circle loader */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '4px solid rgba(162, 89, 255, 0.15)',
                  borderTopColor: 'var(--accent-primary)',
                  animation: 'spin 1.5s linear infinite'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  border: '4px solid rgba(0, 240, 255, 0.1)',
                  borderBottomColor: 'var(--accent-secondary)',
                  animation: 'spin 1s linear infinite reverse'
                }} />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-heading)'
                }}>
                  {progress}%
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }} className="pulse">Generando tu avatar con IA</h2>
                <p style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{progressMsg}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>Esto puede demorar hasta 15 segundos. Por favor, no recargues la página.</p>
              </div>

              {/* Progress bar container */}
              <div style={{ width: '100%', maxWidth: '400px', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.4s ease-out' }} />
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 5: RESULTS SCREEN */}
      {step === 5 && (
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                ¡Tus Avatares están listos! <Sparkles size={24} color="var(--accent-secondary)" />
              </h2>
              <p>Aquí tienes {generatedResults.length} variaciones generadas con el estilo <strong>{selectedStyle?.name}</strong>.</p>
            </div>
            
            <button onClick={handleRestart} className="btn btn-secondary">
              <RefreshCw size={16} /> Crear Otro
            </button>
          </div>

          {/* Results Grid */}
          <div className="grid-cols-3">
            {generatedResults.map((res) => (
              <div
                key={res.id}
                className="glass-card"
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden', background: '#151320', position: 'relative' }}>
                  <img src={res.preview_url} alt="Resultado Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  {res.is_watermarked && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.6)',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.6rem',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      Watermark
                    </div>
                  )}

                  {/* Actions overlay on hover */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    opacity: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'opacity 0.2s'
                  }}
                  className="hover-overlay"
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                  >
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '8px' }}
                      onClick={() => setSelectedResult(res)}
                    >
                      <Maximize2 size={16} />
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px' }}
                      onClick={() => downloadImage(res.download_url, `avatar-ia-${res.id}.png`)}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    Resolución: {res.resolution}
                  </span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => downloadImage(res.download_url, `avatar-ia-${res.id}.png`)}
                  >
                    <Download size={14} /> Descargar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button onClick={() => navigate('/app/dashboard')} className="btn btn-secondary">
              Volver al Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Expanded Result Modal */}
      {selectedResult && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 4, 8, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={() => setSelectedResult(null)}
        >
          <div className="glass-panel" style={{
            maxWidth: '540px',
            width: '100%',
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Avatar Generado ({selectedStyle?.name})</h3>
              <span className="badge badge-free" style={{ fontSize: '0.7rem' }}>
                {selectedResult.resolution}
              </span>
            </div>

            <div style={{
              width: '100%',
              aspectRatio: '1/1',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#151320',
              border: '1px solid var(--border-color)',
              position: 'relative'
            }}>
              <img
                src={selectedResult.download_url}
                alt="Avatar ampliado"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              {selectedResult.is_watermarked && (
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.65rem',
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}>
                  Watermark: AvatarIA
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => downloadImage(selectedResult.download_url, `avatar-${selectedResult.id}.png`)}
              >
                <Download size={16} /> Descargar PNG
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedResult(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
