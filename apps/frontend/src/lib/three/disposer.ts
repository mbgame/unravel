/**
 * Three.js resource disposal utilities.
 * Always dispose geometries and materials when unmounting to prevent GPU memory leaks.
 */

import type { BufferGeometry, Material, Texture, Object3D } from 'three';

/**
 * Safely disposes a Three.js BufferGeometry.
 * No-ops if the geometry is null/undefined or already disposed.
 *
 * @param geometry - Geometry to dispose
 */
export function disposeGeometry(geometry: BufferGeometry | null | undefined): void {
  if (!geometry) return;
  geometry.dispose();
}

/**
 * Safely disposes a Three.js Material or array of Materials.
 * Also disposes all textures referenced by the material.
 *
 * @param material - Material (or array of materials) to dispose
 */
export function disposeMaterial(material: Material | Material[] | null | undefined): void {
  if (!material) return;

  const materials = Array.isArray(material) ? material : [material];

  // Dispose known texture properties on standard materials
  const textureKeys = [
    'map',
    'normalMap',
    'roughnessMap',
    'metalnessMap',
    'emissiveMap',
    'aoMap',
  ];

  for (const mat of materials) {
    for (const key of textureKeys) {
      const tex = (mat as unknown as Record<string, unknown>)[key];
      if (tex && typeof (tex as Texture).dispose === 'function') {
        (tex as Texture).dispose();
      }
    }

    mat.dispose();
  }
}

/**
 * Recursively traverses a Three.js Object3D and disposes all
 * geometries and materials in its hierarchy.
 * Use when unmounting complex scene objects.
 *
 * @param object - Root object to traverse and dispose
 */
export function disposeObject(object: Object3D | null | undefined): void {
  if (!object) return;

  object.traverse((child) => {
    const mesh = child as { geometry?: BufferGeometry; material?: Material | Material[] };

    if (mesh.geometry) disposeGeometry(mesh.geometry);
    if (mesh.material) disposeMaterial(mesh.material);
  });
}
