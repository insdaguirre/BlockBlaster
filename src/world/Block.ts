import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/constants';

export class Block {
  private static blockSize = GAME_CONFIG.WORLD.BLOCK_SIZE;

  public static createBlock(
    position: THREE.Vector3,
    color: number = 0x8B4513
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      this.blockSize,
      this.blockSize,
      this.blockSize
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  public static createGroundBlock(
    position: THREE.Vector3,
    color: number = 0x90EE90
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      this.blockSize,
      this.blockSize * 0.1,
      this.blockSize
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.9,
      metalness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    return mesh;
  }

  public static createSandBlock(position: THREE.Vector3): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      this.blockSize,
      this.blockSize * 0.1,
      this.blockSize
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: 0xF4A460, // Sandy brown
      roughness: 0.9,
      metalness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    return mesh;
  }

  public static createWaterBlock(position: THREE.Vector3): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      this.blockSize,
      this.blockSize * 0.1,
      this.blockSize
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x4682B4, // Steel blue
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.7
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    return mesh;
  }

  public static createMetalBlock(
    position: THREE.Vector3,
    color: number = 0x708090
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      this.blockSize,
      this.blockSize,
      this.blockSize
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  public static createRockBlock(position: THREE.Vector3): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      this.blockSize,
      this.blockSize,
      this.blockSize
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x696969, // Dim gray
      roughness: 0.9,
      metalness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  public static getBlockSize(): number {
    return this.blockSize;
  }
}

