/**
 * Loader for Spectacles/Grasshopper JSON 3D format (Three.js Object format v4.x).
 *
 * These files use the legacy Three.js `Geometry` type which was removed in r125+.
 * This loader manually converts the old format into modern BufferGeometry objects.
 */
import * as THREE from 'three';

interface SpectaclesGeometry {
  uuid: string;
  type: string;
  data: {
    vertices: number[];
    faces: number[];
    normals?: number[];
    uvs?: number[];
    scale?: number;
    visible?: boolean;
  };
}

interface SpectaclesMaterial {
  uuid: string;
  type: string;
  color?: string;
  ambient?: string;
  emissive?: string;
  side?: number;
  opacity?: number;
  transparent?: boolean;
  shading?: number;
  linewidth?: number;
}

interface SpectaclesChild {
  uuid: string;
  name?: string;
  type: string;
  geometry?: string;
  material?: string;
  matrix?: number[];
  children?: SpectaclesChild[];
  userData?: Record<string, unknown>;
}

interface SpectaclesScene {
  metadata: { version: number; type: string; generator: string };
  geometries: SpectaclesGeometry[];
  materials: SpectaclesMaterial[];
  object: SpectaclesChild;
}

/** Parse a hex color string like "0xFF0000" into a THREE.Color */
function parseColor(color: string | undefined): THREE.Color {
  if (!color) return new THREE.Color(0x808080);
  // Handle "0xRRGGBB" format
  if (color.startsWith('0x') || color.startsWith('0X')) {
    return new THREE.Color(parseInt(color, 16));
  }
  return new THREE.Color(color);
}

/** Convert old-style Geometry to BufferGeometry */
function convertGeometry(geom: SpectaclesGeometry): THREE.BufferGeometry {
  const bg = new THREE.BufferGeometry();
  const verts = geom.data.vertices;

  if (geom.data.faces && geom.data.faces.length > 0) {
    // Has faces — build indexed geometry
    // Old Three.js face format: type flag, then vertex indices
    // type 0 = triangle (3 indices), type 1 = quad (4 indices)
    const positions: number[] = [];
    const indices: number[] = [];

    // All vertices as position attribute
    for (let i = 0; i < verts.length; i += 3) {
      positions.push(verts[i], verts[i + 1], verts[i + 2]);
    }

    // Parse face array
    let fi = 0;
    const faces = geom.data.faces;
    while (fi < faces.length) {
      const faceType = faces[fi++];
      const isQuad = !!(faceType & 1);

      if (isQuad) {
        const a = faces[fi++];
        const b = faces[fi++];
        const c = faces[fi++];
        const d = faces[fi++];
        indices.push(a, b, c, a, c, d);
      } else {
        const a = faces[fi++];
        const b = faces[fi++];
        const c = faces[fi++];
        indices.push(a, b, c);
      }

      // Skip optional face data based on type flags
      // bit 1: face material
      if (faceType & 2) fi++;
      // bit 2: face uv (1 or 2 sets)
      if (faceType & 4) fi++;
      if (faceType & 8) fi += (isQuad ? 4 : 3);
      // bit 4: face vertex uv
      // bit 5: face normal
      if (faceType & 16) fi++;
      // bit 6: face vertex normal
      if (faceType & 32) fi += (isQuad ? 4 : 3);
      // bit 7: face color
      if (faceType & 64) fi++;
      // bit 8: face vertex color
      if (faceType & 128) fi += (isQuad ? 4 : 3);
    }

    bg.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    bg.setIndex(indices);
    bg.computeVertexNormals();
  } else {
    // Line geometry — just vertices, no faces
    bg.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(verts, 3)
    );
  }

  return bg;
}

/** Convert a Spectacles material definition to a Three.js material */
function convertMaterial(mat: SpectaclesMaterial): THREE.Material {
  const color = parseColor(mat.color);

  if (mat.type === 'LineBasicMaterial') {
    return new THREE.LineBasicMaterial({
      color,
      linewidth: mat.linewidth ?? 1,
      opacity: mat.opacity ?? 1,
      transparent: (mat.opacity ?? 1) < 1,
    });
  }

  // Default to MeshStandardMaterial (replaces old MeshLambertMaterial)
  const emissive = parseColor(mat.emissive);
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    roughness: 0.7,
    metalness: 0.1,
    opacity: mat.opacity ?? 1,
    transparent: mat.transparent ?? false,
    side: mat.side === 2 ? THREE.DoubleSide : THREE.FrontSide,
  });
}

/** Recursively build the Three.js scene graph */
function buildObject(
  node: SpectaclesChild,
  geometries: Map<string, THREE.BufferGeometry>,
  materials: Map<string, THREE.Material>
): THREE.Object3D {
  let obj: THREE.Object3D;

  const geom = node.geometry ? geometries.get(node.geometry) : undefined;
  const mat = node.material ? materials.get(node.material) : undefined;

  switch (node.type) {
    case 'Scene':
      obj = new THREE.Group();
      break;
    case 'Mesh':
      obj = new THREE.Mesh(
        geom ?? new THREE.BufferGeometry(),
        mat ?? new THREE.MeshStandardMaterial()
      );
      break;
    case 'Line':
      obj = new THREE.Line(
        geom ?? new THREE.BufferGeometry(),
        mat ?? new THREE.LineBasicMaterial()
      );
      break;
    default:
      obj = new THREE.Group();
  }

  if (node.name) obj.name = node.name;

  if (node.matrix) {
    const m = new THREE.Matrix4();
    m.fromArray(node.matrix);
    obj.applyMatrix4(m);
  }

  if (node.children) {
    for (const child of node.children) {
      obj.add(buildObject(child, geometries, materials));
    }
  }

  return obj;
}

/**
 * Load a Spectacles JSON file and return a Three.js Object3D.
 */
export async function loadSpectaclesModel(url: string): Promise<THREE.Object3D> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  const json: SpectaclesScene = await resp.json();

  // Convert geometries
  const geometries = new Map<string, THREE.BufferGeometry>();
  for (const g of json.geometries) {
    geometries.set(g.uuid, convertGeometry(g));
  }

  // Convert materials
  const materials = new Map<string, THREE.Material>();
  for (const m of json.materials) {
    materials.set(m.uuid, convertMaterial(m));
  }

  // Build scene graph
  return buildObject(json.object, geometries, materials);
}
