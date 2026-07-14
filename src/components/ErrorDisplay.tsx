import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { getErrorDetail } from '../utils/errorMessages';

interface ErrorDisplayProps {
  errorCode?: string;
  customMessage?: string;
  onDismiss?: () => void;
}

export default function ErrorDisplay({ errorCode, customMessage, onDismiss }: ErrorDisplayProps) {
  const error = errorCode ? getErrorDetail(errorCode) : null;

  // If no error code and no custom message, don't render
  if (!error && !customMessage) return null;

  const displayMessage = customMessage || error?.message || 'Ocurrió un error inesperado.';
  const displayTitle = error?.title || 'Error';
  const displaySuggestion = error?.suggestion;
  const severity = error?.severity || 'error';

  // Color scheme based on severity
  const colors = {
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.2)',
      text: '#FF6B6B',
      icon: <AlertCircle size={20} />
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.2)',
      text: '#FBBF24',
      icon: <AlertTriangle size={20} />
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.2)',
      text: '#60A5FA',
      icon: <Info size={20} />
    }
  };

  const theme = colors[severity];

  return (
    <div style={{
      background: theme.bg,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      padding: '16px',
      borderRadius: '8px',
      fontSize: '0.95rem',
      display: 'flex',
      gap: '12px',
      textAlign: 'left',
      position: 'relative'
    }}>
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        {theme.icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
          {displayTitle}
        </div>
        <div style={{ fontSize: '0.9rem', marginBottom: displaySuggestion ? '8px' : 0 }}>
          {displayMessage}
        </div>
        {displaySuggestion && (
          <div style={{
            fontSize: '0.85rem',
            opacity: 0.9,
            paddingTop: '8px',
            borderTop: `1px solid ${theme.border}`,
            marginTop: '4px'
          }}>
            💡 <strong>Sugerencia:</strong> {displaySuggestion}
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: theme.text,
            cursor: 'pointer',
            fontSize: '1.2rem',
            lineHeight: 1,
            opacity: 0.6,
            padding: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
        >
          ×
        </button>
      )}
    </div>
  );
}
