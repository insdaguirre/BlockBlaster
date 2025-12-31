import { Vector3, Box3 } from 'three';

/**
 * Check if two AABB boxes intersect
 */
export function checkAABBCollision(
  pos1: Vector3,
  size1: Vector3,
  pos2: Vector3,
  size2: Vector3
): boolean {
  const box1 = new Box3(
    new Vector3(
      pos1.x - size1.x / 2,
      pos1.y - size1.y / 2,
      pos1.z - size1.z / 2
    ),
    new Vector3(
      pos1.x + size1.x / 2,
      pos1.y + size1.y / 2,
      pos1.z + size1.z / 2
    )
  );
  
  const box2 = new Box3(
    new Vector3(
      pos2.x - size2.x / 2,
      pos2.y - size2.y / 2,
      pos2.z - size2.z / 2
    ),
    new Vector3(
      pos2.x + size2.x / 2,
      pos2.y + size2.y / 2,
      pos2.z + size2.z / 2
    )
  );
  
  return box1.intersectsBox(box2);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Distance between two 3D points
 */
export function distance(a: Vector3, b: Vector3): number {
  return a.distanceTo(b);
}

/**
 * Normalize angle to -180 to 180 range
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

