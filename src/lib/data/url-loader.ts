/**
 * Load CSV text from a URL.
 * Resolves the base URL for relative image/3D paths.
 */
export async function loadFromUrl(url: string): Promise<{ csvText: string; baseUrl: string }> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();

  // Base URL is everything before the last slash
  const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

  return { csvText, baseUrl };
}

/**
 * Resolve a potentially relative path to an absolute URL.
 * If the path is already absolute (starts with http:// or https://), return as-is.
 * Otherwise, prepend the base URL.
 */
export function resolveUrl(path: string, baseUrl?: string): string {
  if (!path) return '';

  const trimmed = path.trim();

  // Already absolute
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Data URL or blob
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Relative path — prepend base URL
  if (baseUrl) {
    return baseUrl + trimmed;
  }

  return trimmed;
}
