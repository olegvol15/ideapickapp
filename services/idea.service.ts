import type { Idea, ValidationResult } from '@/types';

/**
 * Sends an idea to /api/validate and returns the validation result.
 * Throws on network or server errors.
 */
export async function validateIdea(idea: Idea): Promise<ValidationResult> {
  const res = await fetch('/api/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? 'Validation failed');
  }

  return res.json() as Promise<ValidationResult>;
}

/**
 * Sends an idea + instruction to /api/refine and returns the updated idea.
 * Throws on network or server errors.
 */
export async function refineIdea(
  idea: Idea,
  instruction: string
): Promise<Idea> {
  const res = await fetch('/api/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea, instruction }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? 'Refinement failed');
  }

  return res.json() as Promise<Idea>;
}
