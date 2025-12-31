import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/constants';
import { CollisionDetector } from '../world/CollisionDetector';

export type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';

export class EnemyAI {
  private state: EnemyState = 'patrol';
  private patrolTarget: THREE.Vector3 | null = null;
  private lastAttackTime: number = 0;
  private detectionRange: number;
  private attackRange: number;
  private attackCooldown: number;

  constructor() {
    this.detectionRange = GAME_CONFIG.ENEMY.DETECTION_RANGE;
    this.attackRange = GAME_CONFIG.ENEMY.ATTACK_RANGE;
    this.attackCooldown = GAME_CONFIG.ENEMY.ATTACK_COOLDOWN;
  }

  public update(
    enemyPosition: THREE.Vector3,
    playerPosition: THREE.Vector3,
    _collisionDetector: CollisionDetector,
    _deltaTime: number
  ): { direction: THREE.Vector3; state: EnemyState; isAttacking: boolean } {
    if (this.state === 'dead') {
      return { direction: new THREE.Vector3(), state: 'dead', isAttacking: false };
    }

    const distanceToPlayer = enemyPosition.distanceTo(playerPosition);
    let direction = new THREE.Vector3();
    let isAttacking = false;

    // State transitions
    if (distanceToPlayer <= this.attackRange) {
      this.state = 'attack';
    } else if (distanceToPlayer <= this.detectionRange) {
      this.state = 'chase';
    } else {
      this.state = 'patrol';
    }

    // State behaviors
    switch (this.state) {
      case 'patrol':
        direction = this.patrol(enemyPosition, _collisionDetector);
        break;
      case 'chase':
        direction = this.chase(enemyPosition, playerPosition, _collisionDetector);
        break;
      case 'attack':
        direction = this.attack(enemyPosition, playerPosition);
        isAttacking = this.canAttack();
        break;
    }

    return { direction, state: this.state, isAttacking };
  }

  private patrol(
    position: THREE.Vector3,
    collisionDetector: CollisionDetector
  ): THREE.Vector3 {
    // If no patrol target or reached target, pick a new one within map bounds
    if (!this.patrolTarget || position.distanceTo(this.patrolTarget) < 1) {
      const mapSize = GAME_CONFIG.WORLD.GROUND_SIZE;
      const halfSize = mapSize / 2;
      const margin = 5; // Keep away from walls
      
      // Generate random waypoint within map bounds
      let attempts = 0;
      let validTarget = false;
      
      while (!validTarget && attempts < 10) {
        const x = (Math.random() * (mapSize - margin * 2)) - (halfSize - margin);
        const z = (Math.random() * (mapSize - margin * 2)) - (halfSize - margin);
        
        this.patrolTarget = new THREE.Vector3(x, position.y, z);
        
        // Simple check: ensure it's not too close to current position
        if (position.distanceTo(this.patrolTarget) > 3) {
          validTarget = true;
        }
        attempts++;
      }
      
      // Fallback: if no valid target found, use a nearby point
      if (!validTarget) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 10 + Math.random() * 20;
        this.patrolTarget = new THREE.Vector3(
          Math.max(-halfSize + margin, Math.min(halfSize - margin, position.x + Math.cos(angle) * distance)),
          position.y,
          Math.max(-halfSize + margin, Math.min(halfSize - margin, position.z + Math.sin(angle) * distance))
        );
      }
    }

    if (!this.patrolTarget) {
      return new THREE.Vector3();
    }
    const direction = new THREE.Vector3()
      .subVectors(this.patrolTarget, position)
      .normalize();
    direction.y = 0;

    // Simple obstacle avoidance: if path is blocked, try to go around
    const testPos = position.clone().add(direction.clone().multiplyScalar(2));
    const enemySize = new THREE.Vector3(1, 2, 1);
    if (collisionDetector.checkCollision(testPos, enemySize)) {
      // Try perpendicular direction
      const perp = new THREE.Vector3(-direction.z, 0, direction.x);
      if (Math.random() > 0.5) perp.multiplyScalar(-1);
      direction.add(perp.multiplyScalar(0.5)).normalize();
    }

    return direction;
  }

  private chase(
    enemyPosition: THREE.Vector3,
    playerPosition: THREE.Vector3,
    collisionDetector: CollisionDetector
  ): THREE.Vector3 {
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, enemyPosition)
      .normalize();
    direction.y = 0;
    
    // Simple obstacle avoidance during chase
    const testPos = enemyPosition.clone().add(direction.clone().multiplyScalar(2));
    const enemySize = new THREE.Vector3(1, 2, 1);
    if (collisionDetector.checkCollision(testPos, enemySize)) {
      // Try to go around obstacle
      const perp = new THREE.Vector3(-direction.z, 0, direction.x);
      if (Math.random() > 0.5) perp.multiplyScalar(-1);
      direction.add(perp.multiplyScalar(0.3)).normalize();
    }
    
    return direction;
  }

  private attack(
    enemyPosition: THREE.Vector3,
    playerPosition: THREE.Vector3
  ): THREE.Vector3 {
    // Face player but don't move much when attacking
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, enemyPosition)
      .normalize();
    direction.y = 0;
    direction.multiplyScalar(0.3); // Slow movement when attacking
    return direction;
  }

  private canAttack(): boolean {
    const currentTime = Date.now();
    if (currentTime - this.lastAttackTime >= this.attackCooldown) {
      this.lastAttackTime = currentTime;
      return true;
    }
    return false;
  }

  public setState(state: EnemyState): void {
    this.state = state;
  }

  public getState(): EnemyState {
    return this.state;
  }
}

