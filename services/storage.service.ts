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

// ─── Roadmap graph persistence ────────────────────────────────────────────────

const GRAPH_PREFIX = 'ideapick:roadmap-graph:';

export interface RoadmapState {
  rmNodes: import('@/types/roadmap.types').RoadmapNode[];
  positions: Record<string, { x: number; y: number }>;
  expandedIds: string[];
}

export function saveRoadmapState(id: string, state: RoadmapState): void {
  try {
    sessionStorage.setItem(`${GRAPH_PREFIX}${id}`, JSON.stringify(state));
  } catch {
    /* quota — silently skip */
  }
}

export function loadRoadmapState(id: string): RoadmapState | null {
  try {
    return JSON.parse(sessionStorage.getItem(`${GRAPH_PREFIX}${id}`) ?? 'null');
  } catch {
    return null;
  }
}

// ─── Plan list ────────────────────────────────────────────────────────────────

export interface PlanEntry {
  id: string;
  title: string;
}

/** Returns all persisted plan entries from sessionStorage. */
export function listPlans(): PlanEntry[] {
  const entries: PlanEntry[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key?.startsWith(PLAN_PREFIX)) continue;
    try {
      const idea = JSON.parse(
        sessionStorage.getItem(key) ?? 'null'
      ) as Idea | null;
      if (idea?.title)
        entries.push({ id: key.slice(PLAN_PREFIX.length), title: idea.title });
    } catch {
      /* skip */
    }
  }
  return entries;
}
