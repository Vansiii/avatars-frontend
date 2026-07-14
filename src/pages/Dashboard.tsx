import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Wand2, ShieldAlert, Sparkles, Download, Maximize2, RefreshCw, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../store';
import CreditsDisplay from '../components/CreditsDisplay';

interface Avatar {
  id: string;
  preview_url: string;
  download_url: string;
  resolution: string;
  is_watermarked: boolean;
}

interface HistoryItem {
  id: string;
  created_at: string;
  completed_at: string | null;
  style_name: string | null;
  style_category: string | null;
  prompt: string | null;
  status: string;
  avatars: Avatar[];
}

export default function Dashboard() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const { fetchWithAuth, user } = useAuthStore();

  const fetchHistory = async (pageNumber: number) => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/users/me/history?page=${pageNumber}&limit=20`);
      if (res.ok) {
        const data: HistoryItem[] = await res.json();
        setHistory(data);
        // If we get 20 items, there might be more on the next page
        setHasMore(data.length === 20);
      }
    } catch (e) {
      console.error('Error fetching history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (hasMore) setPage(page + 1);
  };

  // Days remaining calculation for Free tier avatars expiry
  const getDaysRemaining = (createdAtStr: string) => {
    const created = new Date(createdAtStr);
    const expiry = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry for free tier
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Top Banner Profile Summary */}
      <div className="glass-panel" style={{
        padding: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(162, 89, 255, 0.05) 0%, rgba(18, 16, 26, 0.7) 100%)',
        textAlign: 'left'
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            ¡Hola, {user?.display_name || user?.email.split('@')[0]}! <Sparkles size={24} color="var(--accent-secondary)" />
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)' }}>
            Bienvenido a tu panel de control de avatar. Aquí puedes ver tu historial y generar nuevas identidades visuales.
          </p>
        </div>

        <Link to="/app/generate" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
          <Wand2 size={18} /> Crear Nuevo Avatar
        </Link>
      </div>

      {/* Credits Widget */}
      {user && (
        <CreditsDisplay
          creditsUsed={user.credits_used}
          creditsLimit={user.credits_limit}
          planTier={user.plan_tier}
          variant="full"
          showUpgradeButton={true}
        />
      )}

      {/* History section */}
      <div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'left' }}>
          Historial de Generaciones
        </h3>

        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <span className="spinner" style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>
              <RefreshCw size={32} />
            </span>
            <p>Cargando historial...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <HelpCircle size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '16px', display: 'inline-block' }} />
            <h4 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>No tienes generaciones previas</h4>
            <p style={{ marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              ¡Sube una imagen o proporciona una descripción textual para que nuestra IA cree tu primer avatar!
            </p>
            <Link to="/app/generate" className="btn btn-primary">
              <Wand2 size={16} /> Crear mi primer avatar
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.map((item) => {
                const daysLeft = getDaysRemaining(item.created_at);
                const showExpiryWarning = user?.plan_tier === 'free' && daysLeft <= 7 && daysLeft > 0;

                return (
                  <div key={item.id} className="glass-card" style={{
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr',
                    gap: '24px',
                    textAlign: 'left',
                    alignItems: 'center'
                  }}>
                    {/* Left Column: Details */}
                    <div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <span className="badge badge-pro" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-primary)' }}>
                          {item.style_name || 'Estilo personalizado'}
                        </span>
                        <span className="badge badge-free">
                          {item.style_category || 'IA'}
                        </span>
                      </div>
                      
                      {item.prompt && (
                        <p style={{
                          fontSize: '0.9rem',
                          color: 'var(--color-text-primary)',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '10px',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: '1px solid rgba(255,255,255,0.02)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }} title={item.prompt}>
                          "{item.prompt}"
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <Calendar size={14} />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span style={{
                          color: item.status === 'completed' ? 'var(--color-success)' :
                                 item.status === 'failed' ? 'var(--color-error)' : 'var(--color-warning)'
                        }}>
                          {item.status === 'completed' ? 'Completado' :
                           item.status === 'failed' ? 'Fallido' : 'Procesando...'}
                        </span>
                      </div>

                      {showExpiryWarning && item.status === 'completed' && (
                        <div style={{
                          marginTop: '12px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          color: '#FBBF24',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: '1px solid rgba(245, 158, 11, 0.2)'
                        }}>
                          <ShieldAlert size={14} />
                          <span>Expira en {daysLeft} {daysLeft === 1 ? 'día' : 'días'} (Plan Free)</span>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Avatar Outputs */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {item.status === 'pending' || item.status === 'processing' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                          <RefreshCw size={18} className="spinner" /> Generando variaciones en segundo plano...
                        </div>
                      ) : item.status === 'failed' ? (
                        <div style={{ color: 'var(--color-error)', fontSize: '0.9rem' }}>
                          No se pudieron generar los avatares. Crédito no descontado.
                        </div>
                      ) : (
                        item.avatars.map((avatar) => (
                          <div
                            key={avatar.id}
                            style={{
                              position: 'relative',
                              width: '100px',
                              height: '100px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: '1px solid rgba(255,255,255,0.08)'
                            }}
                            onClick={() => {
                              setSelectedAvatar(avatar);
                              setSelectedItem(item);
                            }}
                          >
                            <img src={avatar.preview_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'rgba(0,0,0,0.4)',
                              opacity: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'opacity 0.2s',
                            }}
                            className="hover-overlay"
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                            >
                              <Maximize2 size={16} color="#fff" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
              <button
                onClick={handlePrevPage}
                className="btn btn-secondary"
                disabled={page === 1}
                style={{ padding: '8px 12px' }}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <span style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
                Página {page}
              </span>
              <button
                onClick={handleNextPage}
                className="btn btn-secondary"
                disabled={!hasMore}
                style={{ padding: '8px 12px' }}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Avatar Modal */}
      {selectedAvatar && (
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
        onClick={() => {
          setSelectedAvatar(null);
          setSelectedItem(null);
        }}
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
              <h3 style={{ fontSize: '1.25rem', textAlign: 'left' }}>
                {selectedItem?.style_name || 'Avatar Generado'}
              </h3>
              <span className="badge badge-free" style={{ fontSize: '0.7rem' }}>
                {selectedAvatar.resolution}
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
                src={selectedAvatar.download_url}
                alt="Avatar grande"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              {selectedAvatar.is_watermarked && (
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.65rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  Watermark: AvatarIA
                </div>
              )}
            </div>

            {selectedItem?.prompt && (
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                textAlign: 'left',
                background: 'rgba(0,0,0,0.15)',
                padding: '10px',
                borderRadius: '8px'
              }}>
                <strong>Prompt:</strong> "{selectedItem.prompt}"
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => downloadImage(selectedAvatar.download_url, `avatar-${selectedAvatar.id}.png`)}
              >
                <Download size={16} /> Descargar PNG
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedAvatar(null)}
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
