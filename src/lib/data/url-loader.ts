/**
 * Normalize cloud-storage URLs to CORS-friendly direct-download variants.
 *
 * Supported providers:
 * - Dropbox: www.dropbox.com → dl.dropboxusercontent.com (CORS: *)
 * - Google Drive: drive.google.com share links → direct export URL
 */
export function normalizeCloudUrl(raw: string): string {
  const url = raw.trim();

  // --- Dropbox ---
  // https://www.dropbox.com/scl/fi/{id}/{file}?rlkey=...&dl=1
  // https://www.dropbox.com/s/{id}/{file}?dl=1
  // → https://dl.dropboxusercontent.com/scl/fi/{id}/{file}?rlkey=...
  if (/^https?:\/\/(www\.)?dropbox\.com\//i.test(url)) {
    const u = new URL(url);
    u.hostname = 'dl.dropboxusercontent.com';
    u.searchParams.delete('dl'); // dl param not needed for direct download
    return u.toString();
  }

  // --- Google Drive ---
  // https://drive.google.com/file/d/{id}/view?...
  // https://drive.google.com/open?id={id}
  const gdriveFileMatch = url.match(
    /^https?:\/\/drive\.google\.com\/file\/d\/([^/]+)/i
  );
  if (gdriveFileMatch) {
    return `https://drive.google.com/uc?export=download&id=${gdriveFileMatch[1]}`;
  }
  const gdriveOpenMatch = url.match(
    /^https?:\/\/drive\.google\.com\/open\?.*id=([^&]+)/i
  );
  if (gdriveOpenMatch) {
    return `https://drive.google.com/uc?export=download&id=${gdriveOpenMatch[1]}`;
  }

  return url;
}

/**
 * Load CSV text from a URL.
 * Cloud-storage URLs (Dropbox, Google Drive) are automatically normalised
 * to their CORS-friendly direct-download equivalents.
 */
export async function loadFromUrl(
  rawUrl: string
): Promise<{ csvText: string; baseUrl: string; resolvedUrl: string }> {
  const resolvedUrl = normalizeCloudUrl(rawUrl);

  const response = await fetch(resolvedUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to load CSV: ${response.status} ${response.statusText}`
    );
  }

  const csvText = await response.text();

  // Base URL is everything before the last slash
  const baseUrl = resolvedUrl.substring(0, resolvedUrl.lastIndexOf('/') + 1);

  return { csvText, baseUrl, resolvedUrl };
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
