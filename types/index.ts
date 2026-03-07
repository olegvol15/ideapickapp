export type DifficultyLevel = "Easy" | "Medium" | "Hard";
export type ProductType = "SaaS" | "AI Tool" | "Chrome Extension" | "Dev Tool";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Idea {
  title: string;
  description: string;
  problem: string;
  audience: string;
  tags: string[];
  difficulty: DifficultyLevel;
}

export interface GenerateRequest {
  prompt: string;
  productType?: string;
  difficulty?: string;
}

export interface GenerateResponse {
  ideas: Idea[];
}
