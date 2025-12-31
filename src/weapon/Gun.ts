import * as THREE from 'three';
import { Weapon } from './Weapon';
import { InputManager } from '../core/InputManager';
import { Enemy } from '../enemy/Enemy';
import { GAME_CONFIG } from '../utils/constants';
import { Bullet } from './Bullet';
import { CollisionDetector } from '../world/CollisionDetector';

export class Gun extends Weapon {
  private muzzleFlashLight: THREE.PointLight | null = null;
  private muzzleFlashEndTime: number = 0;
  private ammo: number;
  private maxAmmo: number;
  private collisionDetector: CollisionDetector;
  private recoilAmount: number = 0;
  private recoilTime: number = 0;

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    inputManager: InputManager,
    collisionDetector: CollisionDetector
  ) {
    super(camera, scene, inputManager);
    this.fireRate = GAME_CONFIG.WEAPON.FIRE_RATE;
    this.damage = GAME_CONFIG.WEAPON.DAMAGE;
    this.range = GAME_CONFIG.WEAPON.RANGE;
    this.maxAmmo = GAME_CONFIG.WEAPON.MAX_AMMO;
    this.ammo = this.maxAmmo;
    this.collisionDetector = collisionDetector;
  }

  public update(deltaTime: number, _enemies: Enemy[], _playerPosition: THREE.Vector3): Bullet | null {
    const currentTime = Date.now();

    // Update recoil animation
    if (this.recoilTime > 0) {
      this.recoilTime -= deltaTime;
      this.recoilAmount = Math.max(0, this.recoilTime / 0.1); // Recoil over 0.1 seconds
      
      // Apply exaggerated camera recoil (pitch up)
      const recoilPitch = this.recoilAmount * 0.3 * deltaTime * 10;
      this.camera.rotation.x += recoilPitch;
    }

    // Handle shooting
    if (
      this.inputManager.isMouseButtonPressed(0) &&
      currentTime - this.lastShotTime >= this.fireRate &&
      this.ammo > 0
    ) {
      const bullet = this.shoot();
      if (bullet) {
        this.ammo--;
        this.lastShotTime = currentTime;
        // Start recoil animation
        this.recoilTime = 0.1;
        this.recoilAmount = 1;
        return bullet;
      }
    }

    // Update muzzle flash
    if (this.muzzleFlashLight && currentTime >= this.muzzleFlashEndTime) {
      this.scene.remove(this.muzzleFlashLight);
      this.muzzleFlashLight = null;
    } else if (this.muzzleFlashLight) {
      // Fade out muzzle flash
      const remaining = this.muzzleFlashEndTime - currentTime;
      const fade = remaining / GAME_CONFIG.WEAPON.MUZZLE_FLASH_DURATION;
      this.muzzleFlashLight.intensity = 2 * fade;
    }

    return null;
  }

  private shoot(): Bullet | null {
    if (this.ammo <= 0) return null;

    // Get camera direction
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    // Spawn bullet from camera position
    const bulletStart = this.camera.position.clone();
    bulletStart.add(direction.clone().multiplyScalar(0.5)); // Start slightly in front of camera

    // Create visible bullet
    const bullet = new Bullet(
      bulletStart,
      direction,
      GAME_CONFIG.WEAPON.BULLET_SPEED,
      this.damage,
      true, // isPlayerBullet
      this.scene,
      this.collisionDetector
    );

    // Create muzzle flash
    this.createMuzzleFlash();

    return bullet;
  }

  private createMuzzleFlash(): void {
    // Remove existing muzzle flash
    if (this.muzzleFlashLight) {
      this.scene.remove(this.muzzleFlashLight);
    }

    // Create new muzzle flash light
    const flashPosition = new THREE.Vector3();
    this.camera.getWorldDirection(flashPosition);
    flashPosition.multiplyScalar(0.5);
    flashPosition.add(this.camera.position);

    this.muzzleFlashLight = new THREE.PointLight(0xffaa00, 2, 5);
    this.muzzleFlashLight.position.copy(flashPosition);
    this.muzzleFlashLight.castShadow = false;
    this.scene.add(this.muzzleFlashLight);

    this.muzzleFlashEndTime = Date.now() + GAME_CONFIG.WEAPON.MUZZLE_FLASH_DURATION;
  }

  public getAmmo(): number {
    return this.ammo;
  }

  public getMaxAmmo(): number {
    return this.maxAmmo;
  }

  public reset(): void {
    this.lastShotTime = 0;
    this.ammo = this.maxAmmo;
    if (this.muzzleFlashLight) {
      this.scene.remove(this.muzzleFlashLight);
      this.muzzleFlashLight = null;
    }
  }
}

