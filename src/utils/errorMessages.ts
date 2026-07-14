/**
 * Error code mapping for generation errors
 * Maps backend error codes to user-friendly Spanish messages
 */

export interface ErrorDetail {
  title: string;
  message: string;
  suggestion?: string;
  severity: 'error' | 'warning' | 'info';
}

export const ERROR_CODES: Record<string, ErrorDetail> = {
  // GEN_001: Invalid file format
  GEN_001: {
    title: 'Formato de archivo no válido',
    message: 'El archivo que intentaste subir no tiene un formato compatible.',
    suggestion: 'Por favor, usa archivos en formato JPEG, PNG o WEBP.',
    severity: 'error'
  },

  // GEN_002: File too large
  GEN_002: {
    title: 'Archivo demasiado grande',
    message: 'La imagen que subiste supera el tamaño máximo permitido de 10 MB.',
    suggestion: 'Intenta comprimir la imagen o usa una de menor resolución.',
    severity: 'error'
  },

  // GEN_003: Out of credits
  GEN_003: {
    title: 'Sin créditos disponibles',
    message: 'Has alcanzado tu límite mensual de créditos.',
    suggestion: 'Actualiza tu plan para obtener más créditos o espera al próximo mes.',
    severity: 'warning'
  },

  // GEN_004: NSFW content rejected
  GEN_004: {
    title: 'Contenido rechazado',
    message: 'El contenido solicitado o generado no cumple con nuestras políticas de uso.',
    suggestion: 'Asegúrate de usar imágenes y descripciones apropiadas. Este rechazo no ha consumido tu crédito.',
    severity: 'error'
  },

  // Generic fallback
  UNKNOWN: {
    title: 'Error desconocido',
    message: 'Ocurrió un error inesperado durante la generación.',
    suggestion: 'Por favor, intenta nuevamente. Si el problema persiste, contacta con soporte.',
    severity: 'error'
  }
};

/**
 * Get error detail from error code
 * @param code - Error code (e.g., "GEN_001")
 * @returns ErrorDetail object with title, message, suggestion
 */
export function getErrorDetail(code: string | undefined): ErrorDetail {
  if (!code) return ERROR_CODES.UNKNOWN;
  return ERROR_CODES[code] || ERROR_CODES.UNKNOWN;
}

/**
 * Extract error code from API response
 * Checks headers first, then response body
 */
export function extractErrorCode(response: Response, data?: any): string | undefined {
  // Check x-error-code header
  const headerCode = response.headers.get('x-error-code');
  if (headerCode) return headerCode;

  // Check response body
  if (data && typeof data === 'object') {
    if (data.error_code) return data.error_code;
    if (data.data && data.data.error_code) return data.data.error_code;
  }

  return undefined;
}
