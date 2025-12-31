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
    // Create ground
    this.createGround();

    // Create walls and obstacles
    this.createWalls();
    this.createObstacles();

    // Set spawn points
    this.setSpawnPoints();
  }

  private createGround(): void {
    const groundSize = GAME_CONFIG.WORLD.GROUND_SIZE;
    const halfSize = groundSize / 2;

    for (let x = -halfSize; x < halfSize; x += this.blockSize) {
      for (let z = -halfSize; z < halfSize; z += this.blockSize) {
        const position = new THREE.Vector3(
          x + this.blockSize / 2,
          -this.blockSize / 2,
          z + this.blockSize / 2
        );
        const block = Block.createGroundBlock(position, 0x90EE90);
        this.scene.add(block);
      }
    }
  }

  private createWalls(): void {
    const wallHeight = 3;
    const wallLength = GAME_CONFIG.WORLD.GROUND_SIZE;
    const halfLength = wallLength / 2;

    // North wall
    for (let x = -halfLength; x < halfLength; x += this.blockSize) {
      for (let y = 0; y < wallHeight; y += this.blockSize) {
        const position = new THREE.Vector3(
          x + this.blockSize / 2,
          y + this.blockSize / 2,
          -halfLength
        );
        const block = Block.createBlock(position, 0x8B4513);
        this.scene.add(block);
        this.collisionDetector.addBlock(block, position);
      }
    }

    // South wall
    for (let x = -halfLength; x < halfLength; x += this.blockSize) {
      for (let y = 0; y < wallHeight; y += this.blockSize) {
        const position = new THREE.Vector3(
          x + this.blockSize / 2,
          y + this.blockSize / 2,
          halfLength
        );
        const block = Block.createBlock(position, 0x8B4513);
        this.scene.add(block);
        this.collisionDetector.addBlock(block, position);
      }
    }

    // East wall
    for (let z = -halfLength; z < halfLength; z += this.blockSize) {
      for (let y = 0; y < wallHeight; y += this.blockSize) {
        const position = new THREE.Vector3(
          halfLength,
          y + this.blockSize / 2,
          z + this.blockSize / 2
        );
        const block = Block.createBlock(position, 0x8B4513);
        this.scene.add(block);
        this.collisionDetector.addBlock(block, position);
      }
    }

    // West wall
    for (let z = -halfLength; z < halfLength; z += this.blockSize) {
      for (let y = 0; y < wallHeight; y += this.blockSize) {
        const position = new THREE.Vector3(
          -halfLength,
          y + this.blockSize / 2,
          z + this.blockSize / 2
        );
        const block = Block.createBlock(position, 0x8B4513);
        this.scene.add(block);
        this.collisionDetector.addBlock(block, position);
      }
    }
  }

  private createObstacles(): void {
    // Create cover obstacles distributed across the larger map
    const mapSize = GAME_CONFIG.WORLD.GROUND_SIZE;
    const halfSize = mapSize / 2;
    const obstaclePositions: THREE.Vector3[] = [];
    
    // Generate obstacles in a grid pattern across the map
    const spacing = 15;
    for (let x = -halfSize + 10; x < halfSize - 10; x += spacing) {
      for (let z = -halfSize + 10; z < halfSize - 10; z += spacing) {
        // Skip center area where player spawns
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
        // Random chance to place obstacle
        if (Math.random() > 0.6) {
          obstaclePositions.push(new THREE.Vector3(x, 0.5, z));
        }
      }
    }

    obstaclePositions.forEach(pos => {
      // Create 2-block high obstacles
      for (let y = 0; y < 2; y++) {
        const position = new THREE.Vector3(
          pos.x,
          y + this.blockSize / 2,
          pos.z
        );
        const block = Block.createBlock(position, 0xA0522D);
        this.scene.add(block);
        this.collisionDetector.addBlock(block, position);
      }
    });
  }

  private setSpawnPoints(): void {
    // Player spawn at center
    this.playerSpawnPoint = new THREE.Vector3(0, 2, 0);

    // Enemy spawn points distributed around the larger map
    const mapSize = GAME_CONFIG.WORLD.GROUND_SIZE;
    const halfSize = mapSize / 2;
    this.enemySpawnPoints = [
      new THREE.Vector3(halfSize * 0.6, 1, halfSize * 0.6),
      new THREE.Vector3(-halfSize * 0.6, 1, halfSize * 0.6),
      new THREE.Vector3(halfSize * 0.6, 1, -halfSize * 0.6),
      new THREE.Vector3(-halfSize * 0.6, 1, -halfSize * 0.6),
      new THREE.Vector3(0, 1, halfSize * 0.7),
      new THREE.Vector3(halfSize * 0.7, 1, 0),
      new THREE.Vector3(-halfSize * 0.7, 1, 0),
      new THREE.Vector3(0, 1, -halfSize * 0.7),
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

