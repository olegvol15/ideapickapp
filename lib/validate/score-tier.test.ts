import { describe, expect, it } from 'vitest';
import { scoreTier } from './score-tier';

describe('scoreTier', () => {
  it('maps scores to bands at the boundaries', () => {
    expect(scoreTier(100)).toBe('strong');
    expect(scoreTier(70)).toBe('strong');
    expect(scoreTier(69)).toBe('promising');
    expect(scoreTier(40)).toBe('promising');
    expect(scoreTier(39)).toBe('weak');
    expect(scoreTier(0)).toBe('weak');
  });
});
