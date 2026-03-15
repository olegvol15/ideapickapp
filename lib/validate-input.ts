import { NextResponse } from 'next/server';
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
} as const;

const VALID_PRODUCT_TYPES = new Set(PRODUCT_TYPE_OPTIONS.map((o) => o.value));
const VALID_DIFFICULTIES = new Set(DIFFICULTY_OPTIONS.map((o) => o.value));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tooLong(value: string, max: number): boolean {
  return value.length > max;
}

function err(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

// ─── Per-route validators ─────────────────────────────────────────────────────

export function validateGenerateInput(
  prompt: string,
  productType: string,
  difficulty: string
): NextResponse | null {
  if (tooLong(prompt, LIMITS.prompt)) {
    return err(`Prompt must be ${LIMITS.prompt} characters or fewer`);
  }
  if (productType && !VALID_PRODUCT_TYPES.has(productType as never)) {
    return err('Invalid product type');
  }
  if (difficulty && !VALID_DIFFICULTIES.has(difficulty as never)) {
    return err('Invalid difficulty');
  }
  return null;
}

export function validateInstruction(instruction: string): NextResponse | null {
  if (tooLong(instruction, LIMITS.instruction)) {
    return err(`Instruction must be ${LIMITS.instruction} characters or fewer`);
  }
  return null;
}

export function validateIdeaSize(idea: unknown): NextResponse | null {
  const size = Buffer.byteLength(JSON.stringify(idea), 'utf8');
  if (size > LIMITS.ideaJson) {
    return err('Idea payload is too large');
  }
  return null;
}

export function validateExpandInput(
  ideaTitle: unknown,
  ideaPitch: unknown,
  nodeId: string,
  nodeLabel: string,
  parentPath: unknown
): NextResponse | null {
  if (typeof ideaTitle === 'string' && tooLong(ideaTitle, LIMITS.ideaTitle)) {
    return err(`Idea title must be ${LIMITS.ideaTitle} characters or fewer`);
  }
  if (typeof ideaPitch === 'string' && tooLong(ideaPitch, LIMITS.ideaPitch)) {
    return err(`Idea pitch must be ${LIMITS.ideaPitch} characters or fewer`);
  }
  if (tooLong(nodeId, LIMITS.nodeId)) {
    return err(`nodeId must be ${LIMITS.nodeId} characters or fewer`);
  }
  if (tooLong(nodeLabel, LIMITS.nodeLabel)) {
    return err(`nodeLabel must be ${LIMITS.nodeLabel} characters or fewer`);
  }
  if (Array.isArray(parentPath)) {
    if (parentPath.length > LIMITS.parentPathItems) {
      return err(`parentPath must have ${LIMITS.parentPathItems} items or fewer`);
    }
    for (const item of parentPath) {
      if (typeof item === 'string' && tooLong(item, LIMITS.parentPathItem)) {
        return err(`Each parentPath item must be ${LIMITS.parentPathItem} characters or fewer`);
      }
    }
  }
  return null;
}
