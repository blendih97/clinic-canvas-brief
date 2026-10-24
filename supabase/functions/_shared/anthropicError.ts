// Turns an Anthropic error response into a short, secret-free description
// suitable for documents.processing_error and admin alerts.
export function describeAnthropicError(status: number, bodyText: string): string {
  let detail = (bodyText || "").trim();
  try {
    const parsed = JSON.parse(bodyText);
    if (parsed?.error) detail = `${parsed.error.type ?? "error"}: ${parsed.error.message ?? ""}`;
  } catch { /* keep raw text */ }
  return `Anthropic API error: ${status} — ${detail}`
    .replace(/sk-[A-Za-z0-9_\-]+/g, "[redacted]")
    .slice(0, 500);
}
