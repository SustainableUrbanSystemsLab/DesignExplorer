import { describe, it, expect } from 'vitest';
import {
  resolveUrl,
  normalizeCloudUrl,
  normalizeGitHubPagesUrl,
} from '../../src/lib/data/url-loader';

describe('resolveUrl', () => {
  it('returns non-GitHub-Pages absolute URLs unchanged', () => {
    const url = 'https://example.com/images/test.png';
    expect(resolveUrl(url)).toBe(url);
  });

  it('returns http URLs unchanged', () => {
    const url = 'http://example.com/images/test.png';
    expect(resolveUrl(url)).toBe(url);
  });

  it('rewrites GitHub Pages URLs to raw.githubusercontent.com', () => {
    const url =
      'https://eddy3d-dev.github.io/Eddy3D-CornellTech-CaseStudy/design_explorer_data/DefaultData/0ScreenParallel.webp';
    expect(resolveUrl(url)).toBe(
      'https://raw.githubusercontent.com/eddy3d-dev/Eddy3D-CornellTech-CaseStudy/gh-pages/design_explorer_data/DefaultData/0ScreenParallel.webp',
    );
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

describe('normalizeCloudUrl', () => {
  it('transforms Dropbox www URLs to dl.dropboxusercontent.com', () => {
    const raw =
      'https://www.dropbox.com/scl/fi/abc123/data.csv?rlkey=xyz&st=tok&dl=1';
    const result = normalizeCloudUrl(raw);
    expect(result).toContain('dl.dropboxusercontent.com');
    expect(result).toContain('/scl/fi/abc123/data.csv');
    expect(result).not.toContain('dl=1');
    expect(result).toContain('rlkey=xyz');
  });

  it('transforms Dropbox short share URLs', () => {
    const raw = 'https://www.dropbox.com/s/abc123/file.csv?dl=1';
    const result = normalizeCloudUrl(raw);
    expect(result).toContain('dl.dropboxusercontent.com');
    expect(result).toContain('/s/abc123/file.csv');
  });

  it('handles Dropbox URLs without www prefix', () => {
    const raw = 'https://dropbox.com/scl/fi/abc/data.csv?rlkey=k&dl=1';
    const result = normalizeCloudUrl(raw);
    expect(result).toContain('dl.dropboxusercontent.com');
  });

  it('transforms Google Drive file URLs', () => {
    const raw = 'https://drive.google.com/file/d/FILE_ID_123/view?usp=sharing';
    const result = normalizeCloudUrl(raw);
    expect(result).toBe(
      'https://drive.google.com/uc?export=download&id=FILE_ID_123',
    );
  });

  it('transforms Google Drive open URLs', () => {
    const raw = 'https://drive.google.com/open?id=FILE_ID_456';
    const result = normalizeCloudUrl(raw);
    expect(result).toBe(
      'https://drive.google.com/uc?export=download&id=FILE_ID_456',
    );
  });

  it('leaves non-cloud URLs unchanged', () => {
    const raw = 'https://example.com/data/study.csv';
    expect(normalizeCloudUrl(raw)).toBe(raw);
  });

  it('leaves GitHub raw URLs unchanged', () => {
    const raw = 'https://raw.githubusercontent.com/user/repo/main/data.csv';
    expect(normalizeCloudUrl(raw)).toBe(raw);
  });
});

describe('normalizeGitHubPagesUrl', () => {
  it('rewrites github.io URLs to raw.githubusercontent.com', () => {
    const url =
      'https://eddy3d-dev.github.io/Eddy3D-CornellTech-CaseStudy/design_explorer_data/DefaultData/0ScreenParallel.webp';
    expect(normalizeGitHubPagesUrl(url)).toBe(
      'https://raw.githubusercontent.com/eddy3d-dev/Eddy3D-CornellTech-CaseStudy/gh-pages/design_explorer_data/DefaultData/0ScreenParallel.webp',
    );
  });

  it('handles any org/repo combination', () => {
    expect(
      normalizeGitHubPagesUrl('https://myorg.github.io/my-repo/assets/img.png'),
    ).toBe(
      'https://raw.githubusercontent.com/myorg/my-repo/gh-pages/assets/img.png',
    );
  });

  it('leaves non-github.io URLs unchanged', () => {
    const url = 'https://example.com/images/test.png';
    expect(normalizeGitHubPagesUrl(url)).toBe(url);
  });

  it('leaves raw.githubusercontent.com URLs unchanged', () => {
    const url =
      'https://raw.githubusercontent.com/user/repo/main/data.csv';
    expect(normalizeGitHubPagesUrl(url)).toBe(url);
  });
});
