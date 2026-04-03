import { describe, it, expect } from 'vitest';
import { resolveUrl } from '../../src/lib/data/url-loader';

describe('resolveUrl', () => {
  it('returns absolute URLs unchanged', () => {
    const url = 'https://example.com/images/test.png';
    expect(resolveUrl(url)).toBe(url);
  });

  it('returns http URLs unchanged', () => {
    const url = 'http://example.com/images/test.png';
    expect(resolveUrl(url)).toBe(url);
  });

  it('prepends base URL for relative paths', () => {
    expect(resolveUrl('test.png', 'https://example.com/data/')).toBe(
      'https://example.com/data/test.png',
    );
  });

  it('handles relative paths without base URL', () => {
    expect(resolveUrl('test.png')).toBe('test.png');
  });

  it('returns empty string for empty input', () => {
    expect(resolveUrl('')).toBe('');
  });

  it('handles data URLs', () => {
    const dataUrl = 'data:image/png;base64,abc123';
    expect(resolveUrl(dataUrl)).toBe(dataUrl);
  });

  it('handles blob URLs', () => {
    const blobUrl = 'blob:http://localhost/abc-123';
    expect(resolveUrl(blobUrl)).toBe(blobUrl);
  });

  it('trims whitespace', () => {
    expect(resolveUrl('  https://example.com/test.png  ')).toBe(
      'https://example.com/test.png',
    );
  });
});
