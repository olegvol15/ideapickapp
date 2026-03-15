import { ErrorCode } from './error-codes';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errorCode: ErrorCode;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;

  constructor(
    message: string,
    statusCode: number,
    errorCode: ErrorCode,
    options: {
      isOperational?: boolean;
      payload?: Record<string, unknown>;
      headers?: Record<string, string>;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = options.isOperational ?? true;
    this.payload = options.payload ?? {};
    this.headers = options.headers;
    Error.captureStackTrace(this, this.constructor);
  }

  static validation(message: string, payload?: Record<string, unknown>): AppError {
    return new AppError(message, 400, ErrorCode.VALIDATION_ERROR, { payload });
  }

  static authRequired(): AppError {
    return new AppError('Authentication required', 401, ErrorCode.AUTH_REQUIRED);
  }

  static authExpired(): AppError {
    return new AppError('Session expired', 401, ErrorCode.AUTH_EXPIRED);
  }

  static forbidden(): AppError {
    return new AppError('Forbidden', 403, ErrorCode.FORBIDDEN);
  }

  static notFound(message = 'Not found'): AppError {
    return new AppError(message, 404, ErrorCode.NOT_FOUND);
  }

  static rateLimit(retryAfterMs?: number): AppError {
    const retryAfterSec = retryAfterMs != null ? Math.ceil(retryAfterMs / 1000) : undefined;
    return new AppError('Rate limit exceeded. Try again later.', 429, ErrorCode.RATE_LIMITED, {
      payload: retryAfterSec != null ? { retryAfter: retryAfterSec } : {},
      headers: retryAfterSec != null ? { 'Retry-After': String(retryAfterSec) } : undefined,
    });
  }

  static ai(message = 'AI request failed. Please try again.'): AppError {
    return new AppError(message, 500, ErrorCode.AI_ERROR, { isOperational: false });
  }

  static invalidAiResponse(message = 'Invalid AI response. Please try again.'): AppError {
    return new AppError(message, 500, ErrorCode.INVALID_AI_RESP, { isOperational: false });
  }

  static internal(message = 'Something went wrong'): AppError {
    return new AppError(message, 500, ErrorCode.INTERNAL_ERROR, { isOperational: false });
  }
}
