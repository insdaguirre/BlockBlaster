import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CollisionDetector } from '../world/CollisionDetector';

describe('CollisionDetector', () => {
  it('detects a collision for a block in the same spatial cell', () => {
    const detector = new CollisionDetector();
    detector.addBlock(new THREE.Mesh(), new THREE.Vector3(0.5, 0.5, 0.5));

    const collided = detector.checkCollision(
      new THREE.Vector3(0.5, 0.5, 0.5),
      new THREE.Vector3(1, 1, 1)
    );

    expect(collided).toBe(true);
  });

  it('detects a collision across neighboring cell boundaries', () => {
    const detector = new CollisionDetector();
    detector.addBlock(new THREE.Mesh(), new THREE.Vector3(1.5, 0.5, 0.5));

    const collided = detector.checkCollision(
      new THREE.Vector3(1.1, 0.5, 0.5),
      new THREE.Vector3(1, 1, 1)
    );

    expect(collided).toBe(true);
  });

  it('returns the tallest ground height for blocks in the queried cell', () => {
    const detector = new CollisionDetector();
    detector.addBlock(new THREE.Mesh(), new THREE.Vector3(0.5, 0.5, 0.5));
    detector.addBlock(new THREE.Mesh(), new THREE.Vector3(0.5, 1.5, 0.5));

    expect(detector.getGroundHeight(0.5, 0.5)).toBe(2);
  });
});
