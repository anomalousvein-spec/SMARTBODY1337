/**
 * Sanitizes string input to prevent basic XSS and trim whitespace
 * @param input - Raw input string
 * @param maxLength - Optional maximum length
 * @returns Sanitized string
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input) return '';

  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .trim()
    .slice(0, maxLength);
}
