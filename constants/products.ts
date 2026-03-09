import type { ProductType, DifficultyLevel } from "@/types";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export const PRODUCT_TYPE_OPTIONS: SelectOption<ProductType>[] = [
  { value: "SaaS",             label: "SaaS" },
  { value: "AI Tool",          label: "AI Tool" },
  { value: "Mobile App",       label: "Mobile App" },
  { value: "Chrome Extension", label: "Chrome Extension" },
  { value: "Dev Tool",         label: "Dev Tool" },
];

export const DIFFICULTY_OPTIONS: SelectOption<DifficultyLevel>[] = [
  { value: "Easy",   label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard",   label: "Hard" },
];

export const REFINE_PRESETS = [
  "Make it simpler",
  "More profitable",
  "B2B focused",
  "AI-focused",
  "Easier to build",
] as const;

export type RefinePreset = (typeof REFINE_PRESETS)[number];
