// server-only — never import in client components
import pino from 'pino';

export const logger = pino(
  { level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' },
  process.env.NODE_ENV !== 'production'
    ? pino.transport({ target: 'pino-pretty', options: { colorize: true } })
    : undefined
);
