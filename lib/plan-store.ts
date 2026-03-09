import type { Idea } from "@/types";

const PREFIX = "ideapick:plan:";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function setPlan(idea: Idea): string {
  const id = slugify(idea.title);
  sessionStorage.setItem(`${PREFIX}${id}`, JSON.stringify(idea));
  return id;
}

export function getPlan(id: string): Idea | null {
  try {
    return JSON.parse(sessionStorage.getItem(`${PREFIX}${id}`) ?? "null");
  } catch {
    return null;
  }
}
