import { AppError } from './errors/app-error';
import { PRODUCT_TYPE_OPTIONS, DIFFICULTY_OPTIONS } from '@/constants/products';

// ─── Limits ───────────────────────────────────────────────────────────────────

const LIMITS = {
  prompt: 500,
  instruction: 300,
  ideaJson: 8_192,   // bytes — a normal AI-generated idea is ~1-2 KB
  ideaTitle: 200,
  ideaPitch: 600,
  nodeId: 100,
  nodeLabel: 200,
  parentPathItems: 10,
  parentPathItem: 200,
  validateDescription: 600,
  validateAudience: 200,
  validateProblem: 300,
} as const;

const VALID_PRODUCT_TYPES = new Set(PRODUCT_TYPE_OPTIONS.map((o) => o.value));
const VALID_DIFFICULTIES = new Set(DIFFICULTY_OPTIONS.map((o) => o.value));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tooLong(value: string, max: number): boolean {
  return value.length > max;
}

// ─── Per-route validators ─────────────────────────────────────────────────────

export function validateGenerateInput(
  prompt: string,
  productType: string,
  difficulty: string
): void {
  if (tooLong(prompt, LIMITS.prompt)) {
    throw AppError.validation(`Prompt must be ${LIMITS.prompt} characters or fewer`);
  }
  if (productType && !VALID_PRODUCT_TYPES.has(productType as never)) {
    throw AppError.validation('Invalid product type');
  }
  if (difficulty && !VALID_DIFFICULTIES.has(difficulty as never)) {
    throw AppError.validation('Invalid difficulty');
  }
}

export function validateInstruction(instruction: string): void {
  if (tooLong(instruction, LIMITS.instruction)) {
    throw AppError.validation(`Instruction must be ${LIMITS.instruction} characters or fewer`);
  }
}

export function validateIdeaSize(idea: unknown): void {
  const size = Buffer.byteLength(JSON.stringify(idea), 'utf8');
  if (size > LIMITS.ideaJson) {
    throw AppError.validation('Idea payload is too large');
  }
}

export function validateValidateInput(
  description: string,
  productType: string,
  audience?: string,
  problem?: string
): void {
  if (!description || !description.trim()) {
    throw AppError.validation('Description is required');
  }
  if (tooLong(description, LIMITS.validateDescription)) {
    throw AppError.validation(`Description must be ${LIMITS.validateDescription} characters or fewer`);
  }
  if (!productType || !VALID_PRODUCT_TYPES.has(productType as never)) {
    throw AppError.validation('Invalid product type');
  }
  if (audience && tooLong(audience, LIMITS.validateAudience)) {
    throw AppError.validation(`Audience must be ${LIMITS.validateAudience} characters or fewer`);
  }
  if (problem && tooLong(problem, LIMITS.validateProblem)) {
    throw AppError.validation(`Problem must be ${LIMITS.validateProblem} characters or fewer`);
  }
}

export function validateExpandInput(
  ideaTitle: unknown,
  ideaPitch: unknown,
  nodeId: string,
  nodeLabel: string,
  parentPath: unknown
): void {
  if (typeof ideaTitle === 'string' && tooLong(ideaTitle, LIMITS.ideaTitle)) {
    throw AppError.validation(`Idea title must be ${LIMITS.ideaTitle} characters or fewer`);
  }
  if (typeof ideaPitch === 'string' && tooLong(ideaPitch, LIMITS.ideaPitch)) {
    throw AppError.validation(`Idea pitch must be ${LIMITS.ideaPitch} characters or fewer`);
  }
  if (tooLong(nodeId, LIMITS.nodeId)) {
    throw AppError.validation(`nodeId must be ${LIMITS.nodeId} characters or fewer`);
  }
  if (tooLong(nodeLabel, LIMITS.nodeLabel)) {
    throw AppError.validation(`nodeLabel must be ${LIMITS.nodeLabel} characters or fewer`);
  }
  if (Array.isArray(parentPath)) {
    if (parentPath.length > LIMITS.parentPathItems) {
      throw AppError.validation(`parentPath must have ${LIMITS.parentPathItems} items or fewer`);
    }
    for (const item of parentPath) {
      if (typeof item === 'string' && tooLong(item, LIMITS.parentPathItem)) {
        throw AppError.validation(`Each parentPath item must be ${LIMITS.parentPathItem} characters or fewer`);
      }
    }
  }
}
