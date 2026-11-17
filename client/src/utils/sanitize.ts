/**
 * HTML Sanitization and XSS Prevention Utilities
 */

/**
 * Escapes unsafe HTML characters to prevent Cross-Site Scripting (XSS).
 * Replaces &, <, >, ", and ' with HTML entities.
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe || typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
