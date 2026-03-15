import { NextRequest, NextResponse } from 'next/server';
import { AppError } from './app-error';
import { logger } from '../logger';

function errorResponse(err: AppError): NextResponse {
  return NextResponse.json(
    {
      status: 'error',
      code: err.errorCode,
      message: err.message,
      data: err.payload,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
    {
      status: err.statusCode,
      headers: err.headers,
    }
  );
}

export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof AppError) {
        if (err.statusCode >= 500) {
          logger.error({ err, url: req.url }, err.message);
        }
        return errorResponse(err);
      }
      logger.error({ err, url: req.url }, 'Unhandled error');
      return errorResponse(AppError.internal());
    }
  };
}
