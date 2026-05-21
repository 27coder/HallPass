/**
 * Sanitization utilities to prevent XSS attacks
 */

export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return (
    input
      .trim()
      .slice(0, maxLength)
      // Escape HTML special characters
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  );
}

export function sanitizeRoomCode(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Room codes should be alphanumeric only, max 10 chars
  return input.trim().slice(0, 10).replace(/[^a-zA-Z0-9\-]/g, '');
}

export function validateInput(
  input: string,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 500
): { valid: boolean; error?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = input.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} character(s)` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
  }

  return { valid: true };
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
