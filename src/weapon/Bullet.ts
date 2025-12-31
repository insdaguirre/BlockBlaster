import * as THREE from 'three';
import { CollisionDetector } from '../world/CollisionDetector';
import { GAME_CONFIG } from '../utils/constants';

export class Bullet {
  private mesh: THREE.Mesh;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private lifetime: number;
  private maxLifetime: number;
  private damage: number;
  private isPlayerBullet: boolean;
  private collisionDetector: CollisionDetector;
  private hasHit: boolean = false;

  constructor(
    startPosition: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    damage: number,
    isPlayerBullet: boolean,
    scene: THREE.Scene,
    collisionDetector: CollisionDetector
  ) {
    this.position = startPosition.clone();
    this.velocity = direction.clone().normalize().multiplyScalar(speed);
    this.damage = damage;
    this.isPlayerBullet = isPlayerBullet;
    this.collisionDetector = collisionDetector;
    this.maxLifetime = 3; // 3 seconds
    this.lifetime = this.maxLifetime;

    // Create visible bullet mesh
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: isPlayerBullet ? 0xffff00 : 0xff0000, // Yellow for player, red for enemy
      emissive: isPlayerBullet ? 0xffff00 : 0xff0000,
      emissiveIntensity: 0.5
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = false; // Disable shadows for bullets to improve performance
    scene.add(this.mesh);

    // Add point light for glow effect
    const light = new THREE.PointLight(
      isPlayerBullet ? 0xffff00 : 0xff0000,
      1,
      2
    );
    light.position.copy(this.position);
    this.mesh.add(light);
  }

  public update(deltaTime: number): void {
    if (this.hasHit) return;

    // Update lifetime
    this.lifetime -= deltaTime;
    if (this.lifetime <= 0) {
      this.hasHit = true;
      return;
    }

    // Step-based movement to prevent tunneling through walls
    const movement = this.velocity.clone().multiplyScalar(deltaTime);
    const distance = movement.length();
    const stepSize = 0.2; // Maximum step size for collision checking
    const steps = Math.max(1, Math.ceil(distance / stepSize));
    const stepMovement = movement.divideScalar(steps);
    const bulletSize = new THREE.Vector3(0.2, 0.2, 0.2);

    // Move in small steps, checking collision at each step
    for (let step = 0; step < steps; step++) {
      const testPosition = this.position.clone().add(stepMovement);

      // Check collision with world at this step
      if (this.collisionDetector.checkCollision(testPosition, bulletSize)) {
        this.hasHit = true;
        return;
      }

      // Check if bullet is out of bounds
      const mapSize = GAME_CONFIG.WORLD.GROUND_SIZE;
      const halfSize = mapSize / 2;
      if (
        Math.abs(testPosition.x) > halfSize ||
        Math.abs(testPosition.z) > halfSize ||
        testPosition.y < -5 ||
        testPosition.y > 50
      ) {
        this.hasHit = true;
        return;
      }

      // Move to this position
      this.position.copy(testPosition);
    }

    // Update mesh position
    this.mesh.position.copy(this.position);
  }

  public checkEnemyCollision(enemyPosition: THREE.Vector3, enemySize: number): boolean {
    if (this.hasHit || !this.isPlayerBullet) return false;

    const distance = this.position.distanceTo(enemyPosition);
    return distance < enemySize + 0.2;
  }

  public checkPlayerCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    if (this.hasHit || this.isPlayerBullet) return false;

    const distance = this.position.distanceTo(playerPosition);
    return distance < playerRadius + 0.2;
  }

  public getDamage(): number {
    return this.damage;
  }

  public isExpired(): boolean {
    return this.hasHit || this.lifetime <= 0;
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getIsPlayerBullet(): boolean {
    return this.isPlayerBullet;
  }

  public dispose(): void {
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
    // Dispose of light
    this.mesh.children.forEach(child => {
      if (child instanceof THREE.PointLight) {
        child.dispose();
      }
    });
  }
}

