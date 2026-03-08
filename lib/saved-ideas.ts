import type { Idea } from "@/types";

const KEY = "ideapick:saved";

export function getSaved(): Idea[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Idea[];
  } catch {
    return [];
  }
}

export function isSaved(title: string): boolean {
  return getSaved().some((i) => i.title === title);
}

export function toggleSave(idea: Idea): boolean {
  const saved = getSaved();
  const exists = saved.some((i) => i.title === idea.title);
  const next = exists ? saved.filter((i) => i.title !== idea.title) : [...saved, idea];
  localStorage.setItem(KEY, JSON.stringify(next));
  return !exists; // returns new saved state
}
