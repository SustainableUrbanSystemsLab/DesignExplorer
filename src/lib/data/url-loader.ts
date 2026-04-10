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

/** Public CORS proxies raced concurrently when a direct fetch is blocked. */
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) =>
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/** Timeout for each individual fetch attempt in ms. */
const FETCH_TIMEOUT_MS = 8_000;

/** Number of full retry cycles (direct + all proxies) before giving up. */
const MAX_RETRIES = 2;

/** Delay between retry cycles in ms. */
const RETRY_DELAY_MS = 500;

/**
 * Fetch a URL with a timeout. Returns the response text if successful.
 * Throws on network error, timeout, non-OK status, or abort.
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  externalSignal?: AbortSignal
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

/**
 * Load CSV text from a URL.
 *
 * 1. Cloud-storage URLs (Dropbox, Google Drive) are normalised first.
 * 2. A direct `fetch` is attempted (with timeout).
 * 3. If the direct fetch fails (typically CORS), public CORS proxies are
 *    raced concurrently — the fastest successful response wins.
 * 4. If all methods fail, the whole cycle retries up to MAX_RETRIES times.
 *
 * An optional AbortSignal allows the caller to cancel in-flight loads.
 */
export async function loadFromUrl(
  rawUrl: string,
  signal?: AbortSignal
): Promise<{ csvText: string; baseUrl: string; resolvedUrl: string }> {
  const resolvedUrl = normalizeCloudUrl(rawUrl);
  const baseUrl = resolvedUrl.substring(
    0,
    resolvedUrl.lastIndexOf('/') + 1
  );

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }

    if (signal?.aborted) {
      throw new DOMException('Load cancelled', 'AbortError');
    }

    // --- Try direct fetch first (instant failure for CORS) ---
    try {
      const csvText = await fetchWithTimeout(
        resolvedUrl,
        FETCH_TIMEOUT_MS,
        signal
      );
      return { csvText, baseUrl, resolvedUrl };
    } catch {
      // Direct fetch failed — try CORS proxies
    }

    // --- Race all CORS proxies concurrently ---
    try {
      const csvText = await Promise.any(
        CORS_PROXIES.map((buildProxyUrl) =>
          fetchWithTimeout(
            buildProxyUrl(resolvedUrl),
            FETCH_TIMEOUT_MS,
            signal
          )
        )
      );
      return { csvText, baseUrl, resolvedUrl };
    } catch {
      // All proxies failed this cycle — retry
    }
  }

  throw new Error(
    'Failed to fetch CSV after multiple attempts. The server may be temporarily unavailable or blocking cross-origin requests.'
  );
}

/**
 * Rewrite GitHub Pages URLs to raw.githubusercontent.com.
 *
 * GitHub Pages sites with custom domains can break image serving when the
 * custom domain is redirected elsewhere. The underlying files are still
 * accessible via raw.githubusercontent.com.
 *
 * Pattern: https://{org}.github.io/{repo}/path/to/file
 *       → https://raw.githubusercontent.com/{org}/{repo}/gh-pages/path/to/file
 */
export function normalizeGitHubPagesUrl(url: string): string {
  const match = url.match(
    /^https?:\/\/([^.]+)\.github\.io\/([^/]+)\/(.+)$/i
  );
  if (match) {
    const [, org, repo, path] = match;
    return `https://raw.githubusercontent.com/${org}/${repo}/gh-pages/${path}`;
  }
  return url;
}

/**
 * Resolve a potentially relative path to an absolute URL.
 * If the path is already absolute (starts with http:// or https://), return as-is.
 * Otherwise, prepend the base URL.
 *
 * GitHub Pages URLs are rewritten to raw.githubusercontent.com to avoid
 * broken custom-domain redirects.
 */
export function resolveUrl(path: string, baseUrl?: string): string {
  if (!path) return '';

  const trimmed = path.trim();

  // Already absolute
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return normalizeGitHubPagesUrl(trimmed);
  }

  // Data URL or blob
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Relative path — prepend base URL
  if (baseUrl) {
    return normalizeGitHubPagesUrl(baseUrl + trimmed);
  }

  return trimmed;
}
