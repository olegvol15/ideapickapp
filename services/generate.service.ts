import type { GenerateRequest, GenerateResponse } from "@/types";

/**
 * Calls the /api/generate endpoint and returns the full research result.
 * Throws an Error with a user-readable message on failure.
 */
export async function generateIdeas(
  request: GenerateRequest,
): Promise<GenerateResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? "Something went wrong",
    );
  }

  return res.json() as Promise<GenerateResponse>;
}
