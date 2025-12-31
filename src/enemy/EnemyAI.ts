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
  private lastDamageTime: number = 0;
  private healthPercentage: number = 1.0;
  private lastKnownPlayerPosition: THREE.Vector3 | null = null;
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.detectionRange = GAME_CONFIG.ENEMY.DETECTION_RANGE;
    this.attackRange = GAME_CONFIG.ENEMY.ATTACK_RANGE;
    this.attackCooldown = GAME_CONFIG.ENEMY.ATTACK_COOLDOWN;
  }

  public update(
    enemyPosition: THREE.Vector3,
    playerPosition: THREE.Vector3,
    collisionDetector: CollisionDetector,
    deltaTime: number,
    healthPercentage: number = 1.0,
    wasDamaged: boolean = false
  ): { direction: THREE.Vector3; state: EnemyState; isAttacking: boolean; aimOffset?: THREE.Vector3 } {
    if (this.state === 'dead') {
      return { direction: new THREE.Vector3(), state: 'dead', isAttacking: false };
    }

    // Update health and track damage
    this.healthPercentage = healthPercentage;
    if (wasDamaged) {
      this.lastDamageTime = Date.now();
    }

    // Track player velocity for predictive aiming
    if (this.lastKnownPlayerPosition) {
      this.playerVelocity.subVectors(playerPosition, this.lastKnownPlayerPosition).divideScalar(deltaTime || 0.016);
    }
    this.lastKnownPlayerPosition = playerPosition.clone();

    const distanceToPlayer = enemyPosition.distanceTo(playerPosition);
    let direction = new THREE.Vector3();
    let isAttacking = false;
    let aimOffset = new THREE.Vector3();

    // Retreat if low health
    if (this.healthPercentage < 0.3 && distanceToPlayer < this.detectionRange) {
      // Try to find cover and retreat
      direction = this.seekCover(enemyPosition, playerPosition, collisionDetector);
      if (direction.length() < 0.1) {
        // No cover found, retreat directly
        direction = new THREE.Vector3()
          .subVectors(enemyPosition, playerPosition)
          .normalize();
        direction.y = 0;
      }
      return { direction, state: 'chase', isAttacking: false };
    }

    // Seek cover if recently damaged
    const timeSinceDamage = Date.now() - this.lastDamageTime;
    if (timeSinceDamage < 2000 && distanceToPlayer < this.detectionRange) {
      const coverDirection = this.seekCover(enemyPosition, playerPosition, collisionDetector);
      if (coverDirection.length() > 0.1) {
        direction = coverDirection;
        return { direction, state: 'chase', isAttacking: false };
      }
    }

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
        direction = this.patrol(enemyPosition, collisionDetector);
        break;
      case 'chase':
        direction = this.chase(enemyPosition, playerPosition, collisionDetector);
        // Try flanking behavior
        if (distanceToPlayer > this.attackRange * 1.5) {
          const flankDirection = this.flank(enemyPosition, playerPosition, collisionDetector);
          if (flankDirection.length() > 0.1) {
            direction = flankDirection;
          }
        }
        break;
      case 'attack':
        direction = this.attack(enemyPosition, playerPosition);
        // Check line of sight before attacking
        if (this.hasLineOfSight(enemyPosition, playerPosition, collisionDetector)) {
          isAttacking = this.canAttack();
          // Predictive aiming
          if (isAttacking && this.playerVelocity.length() > 0.1) {
            const timeToHit = distanceToPlayer / GAME_CONFIG.ENEMY.BULLET_SPEED;
            aimOffset = this.playerVelocity.clone().multiplyScalar(timeToHit);
          }
        }
        break;
    }

    return { direction, state: this.state, isAttacking, aimOffset };
  }

  private seekCover(
    enemyPosition: THREE.Vector3,
    playerPosition: THREE.Vector3,
    collisionDetector: CollisionDetector
  ): THREE.Vector3 {
    // Look for nearby cover (blocks) to move toward
    const searchRadius = 10;
    const searchSteps = 8;
    let bestCover: THREE.Vector3 | null = null;
    let bestScore = 0;

    for (let i = 0; i < searchSteps; i++) {
      const angle = (i / searchSteps) * Math.PI * 2;
      const testPos = enemyPosition.clone();
      testPos.x += Math.cos(angle) * searchRadius;
      testPos.z += Math.sin(angle) * searchRadius;

      // Check if there's a block nearby (cover)
      const blockSize = new THREE.Vector3(1, 2, 1);
      if (collisionDetector.checkCollision(testPos, blockSize)) {
        // This position has cover
        const distanceToPlayer = testPos.distanceTo(playerPosition);
        const distanceFromEnemy = testPos.distanceTo(enemyPosition);
        const score = distanceToPlayer / (distanceFromEnemy + 1); // Prefer cover that's further from player but not too far

        if (score > bestScore) {
          bestScore = score;
          bestCover = testPos;
        }
      }
    }

    if (bestCover) {
      const direction = new THREE.Vector3()
        .subVectors(bestCover, enemyPosition)
        .normalize();
      direction.y = 0;
      return direction;
    }

    return new THREE.Vector3();
  }

  private flank(
    enemyPosition: THREE.Vector3,
    playerPosition: THREE.Vector3,
    collisionDetector: CollisionDetector
  ): THREE.Vector3 {
    // Try to approach from an angle (45-90 degrees) instead of directly
    const toPlayer = new THREE.Vector3()
      .subVectors(playerPosition, enemyPosition)
      .normalize();
    
    // Calculate perpendicular direction for flanking
    const flankAngle = Math.PI / 3; // 60 degrees
    const perp = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x);
    const flankDirection = new THREE.Vector3()
      .addVectors(
        toPlayer.clone().multiplyScalar(Math.cos(flankAngle)),
        perp.multiplyScalar(Math.sin(flankAngle) * (Math.random() > 0.5 ? 1 : -1))
      )
      .normalize();

    // Check if flank path is clear
    const testPos = enemyPosition.clone().add(flankDirection.clone().multiplyScalar(3));
    const enemySize = new THREE.Vector3(1, 2, 1);
    if (!collisionDetector.checkCollision(testPos, enemySize)) {
      return flankDirection;
    }

    return new THREE.Vector3();
  }

  private hasLineOfSight(
    from: THREE.Vector3,
    to: THREE.Vector3,
    collisionDetector: CollisionDetector
  ): boolean {
    // Simple raycast check - if there's a clear path, return true
    const direction = new THREE.Vector3().subVectors(to, from).normalize();
    const distance = from.distanceTo(to);
    
    // Check a few points along the path
    for (let i = 1; i <= 5; i++) {
      const checkPos = from.clone().add(direction.clone().multiplyScalar((distance * i) / 5));
      const blockSize = new THREE.Vector3(0.5, 0.5, 0.5);
      if (collisionDetector.checkCollision(checkPos, blockSize)) {
        return false; // Path is blocked
      }
    }
    
    return true; // Clear line of sight
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

