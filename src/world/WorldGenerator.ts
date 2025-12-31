import * as THREE from 'three';
import { Block } from './Block';
import { CollisionDetector } from './CollisionDetector';
import { GAME_CONFIG } from '../utils/constants';

export class WorldGenerator {
  private scene: THREE.Scene;
  private collisionDetector: CollisionDetector;
  private playerSpawnPoint: THREE.Vector3;
  private enemySpawnPoints: THREE.Vector3[] = [];
  private blockSize: number;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.collisionDetector = new CollisionDetector();
    this.blockSize = Block.getBlockSize();
    this.playerSpawnPoint = new THREE.Vector3(0, 2, 0);
  }

  public generate(): void {
    // Create beach terrain
    this.createBeachTerrain();

    // Create hills
    this.createHills();

    // Create titan head in water
    this.createTitanHead();

    // Create spacecraft wreckage
    this.createSpacecraftWreckage();

    // Create cover elements (rocks, debris)
    this.createCoverElements();

    // Set spawn points
    this.setSpawnPoints();
  }

  private createBeachTerrain(): void {
    const groundSize = GAME_CONFIG.WORLD.GROUND_SIZE;
    const halfSize = groundSize / 2;
    const waterLevel = -2; // Water is at lower elevation

    for (let x = -halfSize; x < halfSize; x += this.blockSize) {
      for (let z = -halfSize; z < halfSize; z += this.blockSize) {
        const worldX = x + this.blockSize / 2;
        const worldZ = z + this.blockSize / 2;
        
        // Determine if this area is water or sand
        // Water area: negative Z (ocean side)
        const isWater = worldZ < -20;
        const baseHeight = isWater ? waterLevel : 0;

        if (isWater) {
          // Create water blocks
          const position = new THREE.Vector3(worldX, baseHeight, worldZ);
          const block = Block.createWaterBlock(position);
          this.scene.add(block);
        } else {
          // Create sand blocks
          const position = new THREE.Vector3(worldX, baseHeight, worldZ);
          const block = Block.createSandBlock(position);
          this.scene.add(block);
        }
      }
    }
  }

  private createHills(): void {
    const mapSize = GAME_CONFIG.WORLD.GROUND_SIZE;
    const halfSize = mapSize / 2;

    // Create hills using simple height map
    for (let x = -halfSize; x < halfSize; x += this.blockSize) {
      for (let z = -halfSize; z < halfSize; z += this.blockSize) {
        const worldX = x + this.blockSize / 2;
        const worldZ = z + this.blockSize / 2;
        
        // Skip water area
        if (worldZ < -20) continue;

        // Simple height function using sine waves for hills
        const height = Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 2;
        const hillHeight = Math.max(0, Math.floor(height));

        // Create hill blocks
        for (let y = 0; y <= hillHeight; y++) {
          const position = new THREE.Vector3(
            worldX,
            y + this.blockSize / 2,
            worldZ
          );
          
          // Use sand color for hills
          const block = Block.createBlock(position, 0xF4A460);
          this.scene.add(block);
          if (y > 0) {
            this.collisionDetector.addBlock(block, position);
          }
        }
      }
    }
  }

  private createTitanHead(): void {
    // Titan head position in water (negative Z area)
    const titanX = 0;
    const titanZ = -40; // In water area
    const baseY = -1; // Partially submerged

    // Head structure - large block-based head
    const headWidth = 8;
    const headHeight = 12;
    const headDepth = 8;

    // Create head blocks
    for (let x = -headWidth / 2; x < headWidth / 2; x += this.blockSize) {
      for (let y = 0; y < headHeight; y += this.blockSize) {
        for (let z = -headDepth / 2; z < headDepth / 2; z += this.blockSize) {
          // Create face shape (simplified)
          const distFromCenterX = Math.abs(x);
          const distFromCenterZ = Math.abs(z);

          // Skip inner blocks to create hollow structure (optional)
          // Create face features
          if (y > headHeight * 0.3 && y < headHeight * 0.7) {
            // Eye area
            if (distFromCenterX < 2 && distFromCenterZ < 1 && y > headHeight * 0.4 && y < headHeight * 0.6) {
              const position = new THREE.Vector3(
                titanX + x,
                baseY + y + this.blockSize / 2,
                titanZ + z
              );
              const block = Block.createBlock(position, 0x000000); // Black for eyes
              this.scene.add(block);
              this.collisionDetector.addBlock(block, position);
              continue;
            }
          }

          // Main head structure
          if (distFromCenterX < headWidth / 2 && distFromCenterZ < headDepth / 2) {
            const position = new THREE.Vector3(
              titanX + x,
              baseY + y + this.blockSize / 2,
              titanZ + z
            );
            const block = Block.createBlock(position, 0x8B7355); // Skin tone
            this.scene.add(block);
            this.collisionDetector.addBlock(block, position);
          }
        }
      }
    }

    // Add some detail blocks for features
    // Nose
    for (let y = headHeight * 0.5; y < headHeight * 0.7; y += this.blockSize) {
      const position = new THREE.Vector3(
        titanX,
        baseY + y + this.blockSize / 2,
        titanZ + headDepth / 2
      );
      const block = Block.createBlock(position, 0x6B5B4D);
      this.scene.add(block);
      this.collisionDetector.addBlock(block, position);
    }
  }

  private createSpacecraftWreckage(): void {
    // Create multiple wreckage pieces scattered around
    const wreckagePositions = [
      new THREE.Vector3(30, 1, 20),
      new THREE.Vector3(-25, 1, 15),
      new THREE.Vector3(40, 1, -10),
      new THREE.Vector3(-35, 1, -15),
      new THREE.Vector3(20, 1, 35),
      new THREE.Vector3(-20, 1, 30),
    ];

    wreckagePositions.forEach((pos, index) => {
      this.createWreckagePiece(pos, index);
    });
  }

  private createWreckagePiece(position: THREE.Vector3, variant: number): void {
    const size = 4 + (variant % 3); // Vary size
    const height = 3 + (variant % 2);

    // Create main hull piece
    for (let x = 0; x < size; x += this.blockSize) {
      for (let y = 0; y < height; y += this.blockSize) {
        for (let z = 0; z < size; z += this.blockSize) {
          // Create irregular wreckage shape
          if (Math.random() > 0.3) { // Some blocks missing for damaged look
            const blockPos = new THREE.Vector3(
              position.x + x - size / 2,
              position.y + y + this.blockSize / 2,
              position.z + z - size / 2
            );
            const block = Block.createMetalBlock(blockPos, 0x708090);
            this.scene.add(block);
            this.collisionDetector.addBlock(block, blockPos);
          }
        }
      }
    }

    // Add some scattered debris around
    for (let i = 0; i < 5; i++) {
      const debrisX = position.x + (Math.random() - 0.5) * 8;
      const debrisZ = position.z + (Math.random() - 0.5) * 8;
      const debrisY = position.y + Math.random() * 2;
      
      const debrisPos = new THREE.Vector3(debrisX, debrisY, debrisZ);
      const debris = Block.createMetalBlock(debrisPos, 0x556B2F);
      this.scene.add(debris);
      this.collisionDetector.addBlock(debris, debrisPos);
    }

    // Add some angled pieces for dramatic effect
    if (variant % 2 === 0) {
      // Create a tilted piece
      for (let i = 0; i < 3; i++) {
        const tiltedPos = new THREE.Vector3(
          position.x + i * this.blockSize,
          position.y + i * 0.5 + this.blockSize / 2,
          position.z + 2
        );
        const tilted = Block.createMetalBlock(tiltedPos, 0x778899);
        this.scene.add(tilted);
        this.collisionDetector.addBlock(tilted, tiltedPos);
      }
    }
  }

  private createCoverElements(): void {
    const mapSize = GAME_CONFIG.WORLD.GROUND_SIZE;

    // Create rocks scattered across the beach
    const rockPositions: THREE.Vector3[] = [];
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * mapSize * 0.8;
      const z = (Math.random() - 0.5) * mapSize * 0.8;
      // Don't place in water
      if (z > -15) {
        rockPositions.push(new THREE.Vector3(x, 1, z));
      }
    }

    rockPositions.forEach(pos => {
      const rockSize = 1 + Math.floor(Math.random() * 2);
      for (let y = 0; y < rockSize; y++) {
        const position = new THREE.Vector3(
          pos.x + (Math.random() - 0.5) * 0.5,
          pos.y + y + this.blockSize / 2,
          pos.z + (Math.random() - 0.5) * 0.5
        );
        const rock = Block.createRockBlock(position);
        this.scene.add(rock);
        this.collisionDetector.addBlock(rock, position);
      }
    });

    // Create additional debris piles near wreckage
    const debrisPiles = [
      new THREE.Vector3(25, 0.5, 18),
      new THREE.Vector3(-30, 0.5, 12),
      new THREE.Vector3(35, 0.5, -8),
      new THREE.Vector3(-28, 0.5, -12),
    ];

    debrisPiles.forEach(pos => {
      for (let i = 0; i < 3; i++) {
        const debrisPos = new THREE.Vector3(
          pos.x + (Math.random() - 0.5) * 3,
          pos.y + Math.random() * 0.5 + this.blockSize / 2,
          pos.z + (Math.random() - 0.5) * 3
        );
        const debris = Block.createMetalBlock(debrisPos, 0x556B2F);
        this.scene.add(debris);
        this.collisionDetector.addBlock(debris, debrisPos);
      }
    });

    // Create strategic cover positions
    const coverPositions = [
      new THREE.Vector3(15, 1, 25),
      new THREE.Vector3(-15, 1, 25),
      new THREE.Vector3(20, 1, -5),
      new THREE.Vector3(-20, 1, -5),
      new THREE.Vector3(10, 1, 15),
      new THREE.Vector3(-10, 1, 15),
    ];

    coverPositions.forEach(pos => {
      // Create 2-3 block high cover
      const height = 2 + Math.floor(Math.random() * 2);
      for (let y = 0; y < height; y++) {
        const position = new THREE.Vector3(
          pos.x,
          pos.y + y + this.blockSize / 2,
          pos.z
        );
        const cover = Block.createBlock(position, 0xA0522D);
        this.scene.add(cover);
        this.collisionDetector.addBlock(cover, position);
      }
    });
  }

  private setSpawnPoints(): void {
    // Player spawn on beach (away from water)
    this.playerSpawnPoint = new THREE.Vector3(0, 3, 10);

    // Enemy spawn points distributed around the beach
    const mapSize = GAME_CONFIG.WORLD.GROUND_SIZE;
    const halfSize = mapSize / 2;
    this.enemySpawnPoints = [
      new THREE.Vector3(halfSize * 0.5, 2, halfSize * 0.3),
      new THREE.Vector3(-halfSize * 0.5, 2, halfSize * 0.3),
      new THREE.Vector3(halfSize * 0.4, 2, -halfSize * 0.2),
      new THREE.Vector3(-halfSize * 0.4, 2, -halfSize * 0.2),
      new THREE.Vector3(0, 2, halfSize * 0.4),
      new THREE.Vector3(halfSize * 0.6, 2, 0),
      new THREE.Vector3(-halfSize * 0.6, 2, 0),
    ];
  }

  public getCollisionDetector(): CollisionDetector {
    return this.collisionDetector;
  }

  public getPlayerSpawnPoint(): THREE.Vector3 {
    return this.playerSpawnPoint.clone();
  }

  public getEnemySpawnPoints(): THREE.Vector3[] {
    return this.enemySpawnPoints.map(p => p.clone());
  }
}

