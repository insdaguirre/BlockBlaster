import * as THREE from 'three';
import { InputManager } from '../core/InputManager';
import { Enemy } from '../enemy/Enemy';

export abstract class Weapon {
  protected camera: THREE.PerspectiveCamera;
  protected scene: THREE.Scene;
  protected inputManager: InputManager;
  protected lastShotTime: number = 0;
  protected fireRate: number = 600; // milliseconds
  protected damage: number = 25;
  protected range: number = 100;

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    inputManager: InputManager
  ) {
    this.camera = camera;
    this.scene = scene;
    this.inputManager = inputManager;
  }

  public abstract update(deltaTime: number, enemies: Enemy[], playerPosition: THREE.Vector3): any;
  public abstract reset(): void;
}

