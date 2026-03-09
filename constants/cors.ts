export function getCorsHeaders(): Record<string, string> {
  const origin = process.env.LANDING_ORIGIN ?? "*";
  return {
    "Access-Control-Allow-Origin":  origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
