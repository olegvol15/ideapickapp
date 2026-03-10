export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type ProductType =
  | 'SaaS'
  | 'AI Tool'
  | 'Mobile App'
  | 'Chrome Extension'
  | 'Dev Tool';
export type Difficulty = DifficultyLevel;
export type SignalLevel = 'Low' | 'Medium' | 'High';

export interface StackItem {
  layer: string;
  tech: string;
}

export interface Idea {
  title: string;
  pitch: string;
  audience: string;
  problem: string;
  gap: string;
  differentiation: string;
  closestCompetitors: string[];
  mvpFeatures: string[];
  mvpRoadmap: string[];
  techStack: StackItem[];
  firstUsers: string[];
  difficulty: DifficultyLevel;
  marketDemand: SignalLevel;
  competitionLevel: SignalLevel;
  monetizationPotential: SignalLevel;
  confidence: number;
}
