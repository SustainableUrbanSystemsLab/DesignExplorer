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

/** Public CORS proxies tried in order when a direct fetch is blocked. */
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/** Number of full retry cycles (direct + all proxies) before giving up. */
const MAX_RETRIES = 3;

/** Delay between retry cycles in ms. */
const RETRY_DELAY_MS = 1500;

/**
 * Load CSV text from a URL.
 *
 * 1. Cloud-storage URLs (Dropbox, Google Drive) are normalised first.
 * 2. A direct `fetch` is attempted.
 * 3. If the direct fetch fails (typically CORS), public CORS proxies are
 *    tried as a fallback so users can paste *any* hosted CSV link.
 * 4. If all methods fail, the whole cycle retries up to MAX_RETRIES times
 *    (free CORS proxies can be flaky).
 */
export async function loadFromUrl(
  rawUrl: string
): Promise<{ csvText: string; baseUrl: string; resolvedUrl: string }> {
  const resolvedUrl = normalizeCloudUrl(rawUrl);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Wait before retrying (skip delay on first attempt)
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }

    // --- Try direct fetch first ---
    try {
      const response = await fetch(resolvedUrl);
      if (response.ok) {
        const csvText = await response.text();
        const baseUrl = resolvedUrl.substring(
          0,
          resolvedUrl.lastIndexOf('/') + 1
        );
        return { csvText, baseUrl, resolvedUrl };
      }
    } catch {
      // Likely a CORS TypeError — fall through to proxy attempts
    }

    // --- Try CORS proxies ---
    for (const buildProxyUrl of CORS_PROXIES) {
      try {
        const proxyUrl = buildProxyUrl(resolvedUrl);
        const response = await fetch(proxyUrl);
        if (response.ok) {
          const csvText = await response.text();
          // Base URL uses the *original* resolved URL (not the proxy) so
          // relative image paths resolve to the real server.
          const baseUrl = resolvedUrl.substring(
            0,
            resolvedUrl.lastIndexOf('/') + 1
          );
          return { csvText, baseUrl, resolvedUrl };
        }
      } catch {
        // Try next proxy
      }
    }
  }

  throw new Error(
    'Failed to fetch CSV after multiple attempts. The server may be temporarily unavailable.'
  );
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
