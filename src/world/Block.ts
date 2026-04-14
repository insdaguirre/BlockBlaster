import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/constants';

type MaterialConfig = THREE.MeshStandardMaterialParameters & {
  color: number;
};

class BlockMaterialCache {
  private static readonly materials = new Map<string, THREE.MeshStandardMaterial>();

  public static get(config: MaterialConfig): THREE.MeshStandardMaterial {
    const key = JSON.stringify(config);
    const existing = this.materials.get(key);
    if (existing) {
      return existing;
    }

    const material = new THREE.MeshStandardMaterial(config);
    this.materials.set(key, material);
    return material;
  }
}

export class Block {
  private static readonly blockSize = GAME_CONFIG.WORLD.BLOCK_SIZE;
  private static readonly cubeGeometry = new THREE.BoxGeometry(
    this.blockSize,
    this.blockSize,
    this.blockSize
  );
  private static readonly slabGeometry = new THREE.BoxGeometry(
    this.blockSize,
    this.blockSize * 0.1,
    this.blockSize
  );

  public static createBlock(position: THREE.Vector3, color: number = 0x8b4513): THREE.Mesh {
    return this.createMesh(
      this.cubeGeometry,
      position,
      { color, roughness: 0.82, metalness: 0.18 },
      true
    );
  }

  public static createGroundBlock(position: THREE.Vector3, color: number = 0x90ee90): THREE.Mesh {
    return this.createMesh(
      this.slabGeometry,
      position,
      { color, roughness: 0.92, metalness: 0.08 },
      false
    );
  }

  public static createSandBlock(position: THREE.Vector3): THREE.Mesh {
    return this.createMesh(
      this.slabGeometry,
      position,
      { color: 0xf4a460, roughness: 0.94, metalness: 0.06 },
      false
    );
  }

  public static createWaterBlock(position: THREE.Vector3): THREE.Mesh {
    return this.createMesh(
      this.slabGeometry,
      position,
      { color: 0x4682b4, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.7 },
      false
    );
  }

  public static createMetalBlock(position: THREE.Vector3, color: number = 0x708090): THREE.Mesh {
    return this.createMesh(
      this.cubeGeometry,
      position,
      { color, roughness: 0.28, metalness: 0.82 },
      false
    );
  }

  public static createRockBlock(position: THREE.Vector3): THREE.Mesh {
    return this.createMesh(
      this.cubeGeometry,
      position,
      { color: 0x696969, roughness: 0.9, metalness: 0.08 },
      false
    );
  }

  public static getBlockSize(): number {
    return this.blockSize;
  }

  private static createMesh(
    geometry: THREE.BoxGeometry,
    position: THREE.Vector3,
    materialConfig: MaterialConfig,
    castShadow: boolean
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, BlockMaterialCache.get(materialConfig));
    mesh.position.copy(position);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    return mesh;
  }
}
