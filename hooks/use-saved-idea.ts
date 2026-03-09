"use client";

import { useState } from "react";
import type { Idea } from "@/types";
import { isSaved, toggleSave } from "@/services/storage.service";

export interface UseSavedIdeaReturn {
  saved:  boolean;
  toggle: () => void;
}

export function useSavedIdea(idea: Idea): UseSavedIdeaReturn {
  const [saved, setSaved] = useState(() => isSaved(idea.title));

  function toggle() {
    setSaved(toggleSave(idea));
  }

  return { saved, toggle };
}
