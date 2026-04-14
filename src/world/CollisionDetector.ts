import * as THREE from 'three';
import { checkAABBCollision } from '../utils/math';
import { GAME_CONFIG } from '../utils/constants';

interface SpatialEntry {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  size: THREE.Vector3;
}

export class CollisionDetector {
  private readonly blocks: THREE.Mesh[] = [];
  private readonly entries: SpatialEntry[] = [];
  private readonly spatialHash = new Map<string, SpatialEntry[]>();
  private readonly blockSize: number;

  constructor() {
    this.blockSize = GAME_CONFIG.WORLD.BLOCK_SIZE;
  }

  public addBlock(
    mesh: THREE.Mesh,
    position: THREE.Vector3,
    size: THREE.Vector3 = new THREE.Vector3(this.blockSize, this.blockSize, this.blockSize)
  ): void {
    const entry: SpatialEntry = { mesh, position: position.clone(), size: size.clone() };
    this.blocks.push(mesh);
    this.entries.push(entry);

    this.getKeysForBounds(position, size).forEach((key) => {
      const bucket = this.spatialHash.get(key) ?? [];
      bucket.push(entry);
      this.spatialHash.set(key, bucket);
    });
  }

  public checkCollision(
    position: THREE.Vector3,
    size: THREE.Vector3,
    ignoreY: boolean = false
  ): boolean {
    const candidates = this.getNearbyEntries(position, size);

    for (const entry of candidates) {
      if (ignoreY) {
        const pos1 = new THREE.Vector3(position.x, 0, position.z);
        const size1 = new THREE.Vector3(size.x, 0.1, size.z);
        const pos2 = new THREE.Vector3(entry.position.x, 0, entry.position.z);
        const size2 = new THREE.Vector3(entry.size.x, 0.1, entry.size.z);
        if (checkAABBCollision(pos1, size1, pos2, size2)) {
          return true;
        }
        continue;
      }

      if (checkAABBCollision(position, size, entry.position, entry.size)) {
        return true;
      }
    }

    return false;
  }

  public getGroundHeight(x: number, z: number): number {
    const cellKey = this.getKey(x, z);
    const entries = this.spatialHash.get(cellKey) ?? [];
    let maxHeight = GAME_CONFIG.PLAYER.GROUND_HEIGHT;

    entries.forEach((entry) => {
      const halfSizeX = entry.size.x / 2;
      const halfSizeZ = entry.size.z / 2;
      if (
        x >= entry.position.x - halfSizeX &&
        x <= entry.position.x + halfSizeX &&
        z >= entry.position.z - halfSizeZ &&
        z <= entry.position.z + halfSizeZ
      ) {
        maxHeight = Math.max(maxHeight, entry.position.y + entry.size.y / 2);
      }
    });

    return maxHeight;
  }

  public raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number): THREE.Vector3 | null {
    const raycaster = new THREE.Raycaster(origin, direction.clone().normalize());
    const intersects = raycaster.intersectObjects(this.blocks);

    if (intersects.length > 0 && intersects[0].distance <= maxDistance) {
      return intersects[0].point;
    }

    return null;
  }

  private getNearbyEntries(position: THREE.Vector3, size: THREE.Vector3): SpatialEntry[] {
    const keys = this.getKeysForBounds(position, size);
    const deduped = new Set<SpatialEntry>();
    keys.forEach((key) => {
      const bucket = this.spatialHash.get(key);
      if (!bucket) {
        return;
      }

      bucket.forEach((entry) => deduped.add(entry));
    });

    return Array.from(deduped);
  }

  private getKeysForBounds(position: THREE.Vector3, size: THREE.Vector3): string[] {
    const halfX = size.x / 2;
    const halfZ = size.z / 2;
    const minX = Math.floor((position.x - halfX) / this.blockSize);
    const maxX = Math.floor((position.x + halfX) / this.blockSize);
    const minZ = Math.floor((position.z - halfZ) / this.blockSize);
    const maxZ = Math.floor((position.z + halfZ) / this.blockSize);
    const keys: string[] = [];

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        keys.push(`${x}:${z}`);
      }
    }

    return keys;
  }

  private getKey(x: number, z: number): string {
    return `${Math.floor(x / this.blockSize)}:${Math.floor(z / this.blockSize)}`;
  }
}
