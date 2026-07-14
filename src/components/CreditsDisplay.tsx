import { Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreditsDisplayProps {
  creditsUsed: number;
  creditsLimit: number;
  planTier: 'free' | 'pro' | 'enterprise';
  variant?: 'compact' | 'full';
  showUpgradeButton?: boolean;
}

export default function CreditsDisplay({
  creditsUsed,
  creditsLimit,
  planTier,
  variant = 'full',
  showUpgradeButton = true
}: CreditsDisplayProps) {
  const creditsRemaining = creditsLimit - creditsUsed;
  const percentageUsed = (creditsUsed / creditsLimit) * 100;
  const isLowCredits = creditsRemaining <= 2;
  const isOutOfCredits = creditsRemaining <= 0;

  if (variant === 'compact') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        background: isOutOfCredits ? 'rgba(239, 68, 68, 0.1)' : 
                    isLowCredits ? 'rgba(245, 158, 11, 0.1)' : 
                    'rgba(162, 89, 255, 0.08)',
        border: '1px solid',
        borderColor: isOutOfCredits ? 'rgba(239, 68, 68, 0.2)' : 
                     isLowCredits ? 'rgba(245, 158, 11, 0.2)' : 
                     'rgba(162, 89, 255, 0.2)',
        borderRadius: '8px',
        fontSize: '0.9rem'
      }}>
        <Zap size={16} color={isOutOfCredits ? '#FF6B6B' : isLowCredits ? '#FBBF24' : 'var(--accent-primary)'} />
        <span style={{ fontWeight: 600, color: isOutOfCredits ? '#FF6B6B' : 'var(--color-text-primary)' }}>
          {creditsRemaining} / {creditsLimit}
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          créditos
        </span>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      textAlign: 'left'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Créditos Mensuales</h3>
        </div>
        <span className={`badge ${planTier === 'enterprise' ? 'badge-enterprise' : planTier === 'pro' ? 'badge-pro' : 'badge-free'}`}>
          {planTier.toUpperCase()}
        </span>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: isOutOfCredits ? '#FF6B6B' : 'var(--color-text-primary)' }}>
            {creditsRemaining}
          </span>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            de {creditsLimit} disponibles
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${percentageUsed}%`,
            height: '100%',
            background: isOutOfCredits ? 'linear-gradient(90deg, #EF4444, #DC2626)' :
                       isLowCredits ? 'linear-gradient(90deg, #F59E0B, #D97706)' :
                       'var(--accent-gradient)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
          {creditsUsed} créditos utilizados este mes
        </p>
      </div>

      {/* Warning messages */}
      {isOutOfCredits && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '0.85rem',
          color: '#FF6B6B'
        }}>
          <strong>Sin créditos disponibles.</strong> Has alcanzado tu límite mensual. 
          {planTier === 'free' && ' Actualiza a Pro para obtener 100 créditos/mes.'}
        </div>
      )}

      {isLowCredits && !isOutOfCredits && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '0.85rem',
          color: '#FBBF24'
        }}>
          <strong>Créditos bajos.</strong> Solo te quedan {creditsRemaining} {creditsRemaining === 1 ? 'crédito' : 'créditos'}.
          {planTier === 'free' && ' Considera actualizar tu plan.'}
        </div>
      )}

      {/* Upgrade CTA */}
      {showUpgradeButton && planTier === 'free' && (
        <Link to="/app/profile" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          <TrendingUp size={16} /> Actualizar a Pro
        </Link>
      )}

      {planTier === 'enterprise' && (
        <div style={{
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          padding: '8px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '6px'
        }}>
          ✨ Plan Enterprise con créditos ilimitados
        </div>
      )}
    </div>
  );
}
