import type { Idea } from '@/types';

const SAVED_KEY   = 'ideapick:saved';
const PLAN_PREFIX = 'ideapick:plan:';

function getSaved(): Idea[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') as Idea[]; }
  catch { return []; }
}

export function isSaved(title: string): boolean {
  return getSaved().some((i) => i.title === title);
}

/** Returns the new saved state: `true` = now saved, `false` = now unsaved. */
export function toggleSave(idea: Idea): boolean {
  const saved  = getSaved();
  const exists = saved.some((i) => i.title === idea.title);
  const next   = exists ? saved.filter((i) => i.title !== idea.title) : [...saved, idea];
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return !exists;
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

/** Persists an idea as a build plan and returns the generated slug ID. */
export function setPlan(idea: Idea): string {
  const id = slugify(idea.title);
  sessionStorage.setItem(`${PLAN_PREFIX}${id}`, JSON.stringify(idea));
  return id;
}

/** Returns the persisted plan for the given slug ID, or `null` if not found. */
export function getPlan(id: string): Idea | null {
  try { return JSON.parse(sessionStorage.getItem(`${PLAN_PREFIX}${id}`) ?? 'null'); }
  catch { return null; }
}
