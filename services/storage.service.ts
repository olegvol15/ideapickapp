import type { Idea } from '@/types';

const PLAN_PREFIX = 'ideapick:plan:';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/** Persists an idea as a build plan and returns the generated slug ID. */
export function setPlan(idea: Idea): string {
  const id = slugify(idea.title);
  sessionStorage.setItem(`${PLAN_PREFIX}${id}`, JSON.stringify(idea));
  return id;
}

/** Returns the persisted plan for the given slug ID, or `null` if not found. */
export function getPlan(id: string): Idea | null {
  try {
    return JSON.parse(sessionStorage.getItem(`${PLAN_PREFIX}${id}`) ?? 'null');
  } catch {
    return null;
  }
}
