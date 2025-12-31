import * as THREE from 'three';
import { EnemyAI } from './EnemyAI';
import { EnemyHealth } from './EnemyHealth';
import { CollisionDetector } from '../world/CollisionDetector';
import { GAME_CONFIG } from '../utils/constants';
import { Bullet } from '../weapon/Bullet';

export class Enemy {
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private ai: EnemyAI;
  private health: EnemyHealth;
  private collisionDetector: CollisionDetector;
  private scene: THREE.Scene;
  private distanceToPlayer: number = Infinity;
  private lastShotTime: number = 0;
  private animationTime: number = 0;

  constructor(
    startPosition: THREE.Vector3,
    scene: THREE.Scene,
    _playerPositionGetter: () => THREE.Vector3,
    collisionDetector: CollisionDetector
  ) {
    this.position = startPosition.clone();
    this.velocity = new THREE.Vector3();
    this.ai = new EnemyAI();
    this.health = new EnemyHealth();
    this.collisionDetector = collisionDetector;
    this.scene = scene;

    // Create block-style enemy model
    this.mesh = this.createEnemyModel();
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

  private createEnemyModel(): THREE.Group {
    const group = new THREE.Group();
    const size = GAME_CONFIG.ENEMY.SIZE;

    // Body (main block)
    const bodyGeometry = new THREE.BoxGeometry(size * 0.8, size * 1.2, size * 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = size * 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head
    const headGeometry = new THREE.BoxGeometry(size * 0.6, size * 0.6, size * 0.6);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = size * 1.5;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Arms
    const armGeometry = new THREE.BoxGeometry(size * 0.3, size * 0.8, size * 0.3);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-size * 0.6, size * 0.6, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(size * 0.6, size * 0.6, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Legs
    const legGeometry = new THREE.BoxGeometry(size * 0.3, size * 0.6, size * 0.3);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x990000 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-size * 0.25, size * 0.3, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(size * 0.25, size * 0.3, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    return group;
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3): Bullet | null {
    if (this.health.isDead()) {
      this.ai.setState('dead');
      return null;
    }

    this.distanceToPlayer = this.position.distanceTo(playerPosition);

    // Get AI decision
    const aiResult = this.ai.update(
      this.position,
      playerPosition,
      this.collisionDetector,
      deltaTime
    );

    // Move enemy
    const speed = aiResult.state === 'chase' 
      ? GAME_CONFIG.ENEMY.SPEED 
      : GAME_CONFIG.ENEMY.PATROL_SPEED;

    this.velocity.copy(aiResult.direction.multiplyScalar(speed));

    // Apply movement
    const newPosition = this.position.clone();
    newPosition.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Check collision
    const enemySize = new THREE.Vector3(
      GAME_CONFIG.ENEMY.SIZE * 0.8,
      GAME_CONFIG.ENEMY.SIZE * 2,
      GAME_CONFIG.ENEMY.SIZE * 0.8
    );

    const horizontalPos = new THREE.Vector3(
      newPosition.x,
      this.position.y,
      newPosition.z
    );

    if (!this.collisionDetector.checkCollision(horizontalPos, enemySize)) {
      this.position.x = newPosition.x;
      this.position.z = newPosition.z;
    }

    // Keep enemy on ground
    const groundHeight = this.collisionDetector.getGroundHeight(
      this.position.x,
      this.position.z
    );
    this.position.y = groundHeight + GAME_CONFIG.ENEMY.SIZE;

    // Update animation time
    this.animationTime += deltaTime * 10; // Speed up animation

    // Goofy bouncy walking animation
    const isMoving = this.velocity.length() > 0.1;
    let bounceOffset = 0;
    let wobbleRotation = 0;
    let scaleMultiplier = 1;

    if (isMoving) {
      // Bouncy vertical movement
      bounceOffset = Math.sin(this.animationTime) * 0.3;
      
      // Wobble rotation (slight side-to-side)
      wobbleRotation = Math.sin(this.animationTime * 0.7) * 0.2;
      
      // Squash and stretch effect
      const bouncePhase = Math.sin(this.animationTime);
      scaleMultiplier = 1 + bouncePhase * 0.15; // Squash/stretch
    }

    // Attack animation (exaggerated)
    if (aiResult.state === 'attack' && aiResult.isAttacking) {
      // Big scale up and rotation
      scaleMultiplier = 1.3;
      wobbleRotation += Math.sin(this.animationTime * 5) * 0.5;
    }

    // Apply animations
    this.mesh.position.copy(this.position);
    this.mesh.position.y += bounceOffset;

    // Face player or movement direction with wobble
    const directionToPlayer = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .normalize();
    const angle = Math.atan2(directionToPlayer.x, directionToPlayer.z);
    this.mesh.rotation.y = angle + wobbleRotation;

    // Apply scale animation
    this.mesh.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);

    // Try to shoot
    return this.tryShoot(playerPosition);
  }


  public tryShoot(playerPosition: THREE.Vector3): Bullet | null {
    if (this.health.isDead()) return null;

    const currentTime = Date.now();
    const shootCooldown = GAME_CONFIG.ENEMY.SHOOT_COOLDOWN;
    
    // Check if enemy should shoot (in range and cooldown ready)
    if (
      this.distanceToPlayer <= GAME_CONFIG.ENEMY.SHOOT_RANGE &&
      this.distanceToPlayer > GAME_CONFIG.ENEMY.ATTACK_RANGE &&
      currentTime - this.lastShotTime >= shootCooldown
    ) {
      // Shoot at player
      const shootPosition = new THREE.Vector3(
        this.position.x,
        this.position.y + GAME_CONFIG.ENEMY.SIZE * 1.2,
        this.position.z
      );
      
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, shootPosition)
        .normalize();

      const bullet = new Bullet(
        shootPosition,
        direction,
        GAME_CONFIG.ENEMY.BULLET_SPEED,
        GAME_CONFIG.ENEMY.BULLET_DAMAGE,
        false, // isPlayerBullet
        this.scene,
        this.collisionDetector
      );

      this.lastShotTime = currentTime;
      return bullet;
    }

    return null;
  }

  public takeDamage(amount: number): void {
    this.health.takeDamage(amount);
    
    // Visual feedback: briefly change color
    this.mesh.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        const originalColor = material.color.getHex();
        material.color.setHex(0xffffff);
        setTimeout(() => {
          material.color.setHex(originalColor);
        }, 100);
      }
    });
  }

  public isDead(): boolean {
    return this.health.isDead();
  }

  public isAttacking(): boolean {
    return this.ai.getState() === 'attack';
  }

  public getDistanceToPlayer(): number {
    return this.distanceToPlayer;
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }
}

