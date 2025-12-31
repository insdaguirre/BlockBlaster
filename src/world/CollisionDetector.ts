import * as THREE from 'three';
import { checkAABBCollision } from '../utils/math';
import { GAME_CONFIG } from '../utils/constants';

export class CollisionDetector {
  private blocks: THREE.Mesh[] = [];
  private blockPositions: THREE.Vector3[] = [];
  private blockSize: number;

  constructor() {
    this.blockSize = GAME_CONFIG.WORLD.BLOCK_SIZE;
  }

  public addBlock(mesh: THREE.Mesh, position: THREE.Vector3): void {
    this.blocks.push(mesh);
    this.blockPositions.push(position);
  }

  public checkCollision(
    position: THREE.Vector3,
    size: THREE.Vector3,
    ignoreY: boolean = false
  ): boolean {
    for (let i = 0; i < this.blockPositions.length; i++) {
      const blockPos = this.blockPositions[i];
      const blockSize = new THREE.Vector3(
        this.blockSize,
        this.blockSize,
        this.blockSize
      );

      if (ignoreY) {
        // Only check X and Z for ground collision
        const pos1 = new THREE.Vector3(position.x, 0, position.z);
        const size1 = new THREE.Vector3(size.x, 0.1, size.z);
        const pos2 = new THREE.Vector3(blockPos.x, 0, blockPos.z);
        const size2 = new THREE.Vector3(blockSize.x, 0.1, blockSize.z);
        
        if (checkAABBCollision(pos1, size1, pos2, size2)) {
          return true;
        }
      } else {
        if (checkAABBCollision(position, size, blockPos, blockSize)) {
          return true;
        }
      }
    }
    return false;
  }

  public getGroundHeight(x: number, z: number): number {
    // Check for blocks at this X, Z position
    for (const blockPos of this.blockPositions) {
      const halfSize = this.blockSize / 2;
      if (
        x >= blockPos.x - halfSize &&
        x <= blockPos.x + halfSize &&
        z >= blockPos.z - halfSize &&
        z <= blockPos.z + halfSize
      ) {
        return blockPos.y + this.blockSize / 2;
      }
    }
    return GAME_CONFIG.PLAYER.GROUND_HEIGHT;
  }

  public raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number): THREE.Vector3 | null {
    const raycaster = new THREE.Raycaster(origin, direction.normalize());
    const intersects = raycaster.intersectObjects(this.blocks);
    
    if (intersects.length > 0 && intersects[0].distance <= maxDistance) {
      return intersects[0].point;
    }
    return null;
  }
}

