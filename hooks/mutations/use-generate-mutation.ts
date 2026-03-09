"use client";

import { useMutation } from "@tanstack/react-query";
import { generateIdeas } from "@/services/generate.service";
import type { GenerateRequest, GenerateResponse } from "@/types";

/**
 * Typed mutation for POST /api/generate.
 *
 * Variables : GenerateRequest  (prompt, productType, difficulty)
 * Data      : GenerateResponse (marketContext, competitors, ideas, …)
 * Error     : Error            (message surfaced from the service layer)
 */
export function useGenerateMutation() {
  return useMutation<GenerateResponse, Error, GenerateRequest>({
    mutationFn: generateIdeas,
  });
}
