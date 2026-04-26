import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Limits are per-user per sliding window.
// generate is the most expensive (2 LLM calls + Tavily search).
export const generateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 h'),
  prefix: 'rl:generate',
});

// refine / validate / roadmap are single-call operations.
export const refineLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 h'),
  prefix: 'rl:refine',
});

export const validateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 h'),
  prefix: 'rl:validate',
});

export const roadmapLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  prefix: 'rl:roadmap',
});

export const expandLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(40, '1 h'),
  prefix: 'rl:expand',
});
