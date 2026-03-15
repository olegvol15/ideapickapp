export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_REQUIRED:    'AUTH_REQUIRED',
  AUTH_EXPIRED:     'AUTH_EXPIRED',
  FORBIDDEN:        'FORBIDDEN',
  NOT_FOUND:        'NOT_FOUND',
  RATE_LIMITED:     'RATE_LIMITED',
  AI_ERROR:         'AI_ERROR',
  INVALID_AI_RESP:  'INVALID_AI_RESP',
  INTERNAL_ERROR:   'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];
