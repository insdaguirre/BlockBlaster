import * as THREE from 'three';
import { EnemyAI } from './EnemyAI';
import { EnemyHealth } from './EnemyHealth';
import { CollisionDetector } from '../world/CollisionDetector';
import { GAME_CONFIG } from '../utils/constants';
import { Bullet } from '../weapon/Bullet';

export class Boss {
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private ai: EnemyAI;
  private health: EnemyHealth;
  private collisionDetector: CollisionDetector;
  private scene: THREE.Scene;
  private distanceToPlayer: number = Infinity;
  private lastShotTime: number = 0;

  constructor(
    startPosition: THREE.Vector3,
    scene: THREE.Scene,
    _playerPositionGetter: () => THREE.Vector3,
    collisionDetector: CollisionDetector
  ) {
    this.position = startPosition.clone();
    this.velocity = new THREE.Vector3();
    this.ai = new EnemyAI();
    // Create custom health for boss
    this.health = new EnemyHealth();
    this.health.setMaxHealth(GAME_CONFIG.BOSS.MAX_HEALTH);
    this.collisionDetector = collisionDetector;
    this.scene = scene;

    // Create larger boss model
    this.mesh = this.createBossModel();
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

  private createBossModel(): THREE.Group {
    const group = new THREE.Group();
    const size = GAME_CONFIG.BOSS.SIZE;

    // Body (main block) - larger
    const bodyGeometry = new THREE.BoxGeometry(size * 0.8, size * 1.2, size * 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 }); // Dark red
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = size * 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head - larger
    const headGeometry = new THREE.BoxGeometry(size * 0.6, size * 0.6, size * 0.6);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x660000 }); // Darker red
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = size * 1.5;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Arms - larger
    const armGeometry = new THREE.BoxGeometry(size * 0.3, size * 0.8, size * 0.3);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x550000 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-size * 0.6, size * 0.6, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(size * 0.6, size * 0.6, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Legs - larger
    const legGeometry = new THREE.BoxGeometry(size * 0.3, size * 0.6, size * 0.3);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x440000 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-size * 0.25, size * 0.3, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(size * 0.25, size * 0.3, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Add glowing eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-size * 0.2, size * 1.5, size * 0.3);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(size * 0.2, size * 1.5, size * 0.3);
    group.add(rightEye);

    return group;
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3): Bullet | null {
    if (this.health.isDead()) {
      this.ai.setState('dead');
      return null;
    }

    this.distanceToPlayer = this.position.distanceTo(playerPosition);

    // Get AI decision (boss uses same AI but with boss config)
    const aiResult = this.ai.update(
      this.position,
      playerPosition,
      this.collisionDetector,
      deltaTime
    );

    // Move boss
    const speed = aiResult.state === 'chase' 
      ? GAME_CONFIG.BOSS.SPEED 
      : GAME_CONFIG.BOSS.PATROL_SPEED;

    this.velocity.copy(aiResult.direction.multiplyScalar(speed));

    // Apply movement
    const newPosition = this.position.clone();
    newPosition.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Check collision
    const bossSize = new THREE.Vector3(
      GAME_CONFIG.BOSS.SIZE * 0.8,
      GAME_CONFIG.BOSS.SIZE * 2,
      GAME_CONFIG.BOSS.SIZE * 0.8
    );

    const horizontalPos = new THREE.Vector3(
      newPosition.x,
      this.position.y,
      newPosition.z
    );

    if (!this.collisionDetector.checkCollision(horizontalPos, bossSize)) {
      this.position.x = newPosition.x;
      this.position.z = newPosition.z;
    }

    // Keep boss on ground
    const groundHeight = this.collisionDetector.getGroundHeight(
      this.position.x,
      this.position.z
    );
    this.position.y = groundHeight + GAME_CONFIG.BOSS.SIZE;

    // Update mesh position
    this.mesh.position.copy(this.position);

    // Face player
    const directionToPlayer = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .normalize();
    const angle = Math.atan2(directionToPlayer.x, directionToPlayer.z);
    this.mesh.rotation.y = angle;

    // Try to shoot (boss shoots more frequently)
    return this.tryShoot(playerPosition);
  }

  public tryShoot(playerPosition: THREE.Vector3): Bullet | null {
    if (this.health.isDead()) return null;

    const currentTime = Date.now();
    const shootCooldown = GAME_CONFIG.BOSS.SHOOT_COOLDOWN;
    
    // Boss shoots when in range
    if (
      this.distanceToPlayer <= GAME_CONFIG.BOSS.SHOOT_RANGE &&
      this.distanceToPlayer > GAME_CONFIG.BOSS.ATTACK_RANGE &&
      currentTime - this.lastShotTime >= shootCooldown
    ) {
      const shootPosition = new THREE.Vector3(
        this.position.x,
        this.position.y + GAME_CONFIG.BOSS.SIZE * 1.2,
        this.position.z
      );
      
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, shootPosition)
        .normalize();

      const bullet = new Bullet(
        shootPosition,
        direction,
        GAME_CONFIG.BOSS.BULLET_SPEED,
        GAME_CONFIG.BOSS.BULLET_DAMAGE,
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

  public getHealth(): number {
    return this.health.getHealth();
  }

  public getMaxHealth(): number {
    return this.health.getMaxHealth();
  }
}

