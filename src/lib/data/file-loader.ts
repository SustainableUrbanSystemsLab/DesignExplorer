import { unzipSync, strFromU8 } from 'fflate';

/** Result of loading a file (CSV or ZIP) */
export interface FileLoadResult {
  /** The CSV text content */
  csvText: string;
  /** Map of filename → blob URL for images and 3D models extracted from ZIP */
  assets: Map<string, string>;
}

/**
 * Read a dropped/selected File and return CSV text.
 * Supports .csv files directly, or .zip files containing a CSV and assets.
 */
export async function loadFile(file: File): Promise<FileLoadResult> {
  if (file.name.toLowerCase().endsWith('.zip')) {
    return loadZipFile(file);
  }

  const csvText = await file.text();
  return { csvText, assets: new Map() };
}

/**
 * Extract a ZIP file containing a CSV and asset files (images, 3D models).
 * The CSV is identified as the first .csv file found.
 * All other files become blob URLs keyed by their filename.
 */
async function loadZipFile(file: File): Promise<FileLoadResult> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const unzipped = unzipSync(buffer);

  let csvText = '';
  const assets = new Map<string, string>();

  for (const [path, data] of Object.entries(unzipped)) {
    const filename = path.split('/').pop() || path;
    const ext = filename.split('.').pop()?.toLowerCase();

    if (ext === 'csv' && !csvText) {
      csvText = strFromU8(data);
    } else if (isAssetFile(ext)) {
      const blob = new Blob([data as unknown as BlobPart], { type: getMimeType(ext) });
      const url = URL.createObjectURL(blob);
      // Key by the original path (for matching CSV references) and also by filename
      assets.set(path, url);
      if (path !== filename) {
        assets.set(filename, url);
      }
    }
  }

  if (!csvText) {
    throw new Error('No CSV file found in the ZIP archive.');
  }

  return { csvText, assets };
}

function isAssetFile(ext?: string): boolean {
  if (!ext) return false;
  const assetExts = [
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'svg',
    'gltf',
    'glb',
    'stl',
    'obj',
    'mtl',
    'json',
  ];
  return assetExts.includes(ext);
}

function getMimeType(ext?: string): string {
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'gltf':
    case 'json':
      return 'application/json';
    case 'glb':
      return 'model/gltf-binary';
    case 'stl':
      return 'model/stl';
    case 'obj':
    case 'mtl':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}
