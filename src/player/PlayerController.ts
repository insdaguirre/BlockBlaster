import * as THREE from 'three';
import { InputManager } from '../core/InputManager';
import { CollisionDetector } from '../world/CollisionDetector';
import { GAME_CONFIG } from '../utils/constants';

export class PlayerController {
  private camera: THREE.PerspectiveCamera;
  private inputManager: InputManager;
  private collisionDetector: CollisionDetector;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private isGrounded: boolean = false;
  private pitch: number = 0; // Vertical rotation
  private yaw: number = 0; // Horizontal rotation
  private mouseSensitivity: number = 0.002;
  private jumpAnimationTime: number = 0;
  private wasGrounded: boolean = true;

  constructor(
    camera: THREE.PerspectiveCamera,
    startPosition: THREE.Vector3,
    inputManager: InputManager,
    collisionDetector: CollisionDetector
  ) {
    this.camera = camera;
    this.inputManager = inputManager;
    this.collisionDetector = collisionDetector;
    this.position = startPosition.clone();
    this.velocity = new THREE.Vector3();
    
    this.camera.position.copy(this.position);
  }

  public update(deltaTime: number): void {
    // Handle mouse look
    if (this.inputManager.isPointerLocked()) {
      const mouseDelta = this.inputManager.getMouseDelta();
      // Apply sensitivity directly (mouse delta is already per-frame from browser)
      this.yaw -= mouseDelta.x * this.mouseSensitivity;
      this.pitch -= mouseDelta.y * this.mouseSensitivity;
      
      // Clamp pitch to prevent flipping
      this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    }

    // Update camera rotation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Handle movement
    const moveDirection = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
    right.normalize();

    if (this.inputManager.isKeyPressed('w')) {
      moveDirection.add(forward);
    }
    if (this.inputManager.isKeyPressed('s')) {
      moveDirection.sub(forward);
    }
    if (this.inputManager.isKeyPressed('a')) {
      moveDirection.sub(right);
    }
    if (this.inputManager.isKeyPressed('d')) {
      moveDirection.add(right);
    }

    // Normalize movement direction
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      moveDirection.multiplyScalar(GAME_CONFIG.PLAYER.SPEED);
    }

    // Apply gravity
    this.velocity.y += GAME_CONFIG.PLAYER.GRAVITY * deltaTime;

    // Handle jumping with goofy animation
    if (this.inputManager.isKeyPressed(' ') && this.isGrounded) {
      this.velocity.y = GAME_CONFIG.PLAYER.JUMP_FORCE;
      this.isGrounded = false;
      this.jumpAnimationTime = 0; // Reset animation
    }

    // Update jump animation
    if (!this.isGrounded) {
      this.jumpAnimationTime += deltaTime;
    } else if (!this.wasGrounded) {
      // Just landed - bounce effect
      this.jumpAnimationTime = -0.2; // Negative for landing bounce
    }
    this.wasGrounded = this.isGrounded;

    // Update velocity
    this.velocity.x = moveDirection.x;
    this.velocity.z = moveDirection.z;

    // Apply velocity
    const newPosition = this.position.clone();
    newPosition.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Check collisions
    const playerSize = new THREE.Vector3(
      GAME_CONFIG.PLAYER.RADIUS * 2,
      GAME_CONFIG.PLAYER.HEIGHT,
      GAME_CONFIG.PLAYER.RADIUS * 2
    );

    // Check horizontal collision
    const horizontalPos = new THREE.Vector3(
      newPosition.x,
      this.position.y,
      newPosition.z
    );
    if (!this.collisionDetector.checkCollision(horizontalPos, playerSize)) {
      this.position.x = newPosition.x;
      this.position.z = newPosition.z;
    }

    // Check vertical collision (ground)
    const groundHeight = this.collisionDetector.getGroundHeight(
      this.position.x,
      this.position.z
    );
    const minY = groundHeight + GAME_CONFIG.PLAYER.HEIGHT / 2;

    if (newPosition.y <= minY) {
      this.position.y = minY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.position.y = newPosition.y;
      this.isGrounded = false;
    }

    // Update camera position with bouncy jump animation
    let cameraYOffset = GAME_CONFIG.PLAYER.HEIGHT / 2 - 0.2; // Base eye level
    
    // Add bouncy jump effect
    if (this.jumpAnimationTime > 0) {
      // Jumping up - camera goes up
      const jumpPhase = Math.min(this.jumpAnimationTime * 2, 1);
      cameraYOffset += Math.sin(jumpPhase * Math.PI) * 0.5;
    } else if (this.jumpAnimationTime < 0) {
      // Landing - bounce down then up
      const landPhase = Math.abs(this.jumpAnimationTime) * 5;
      cameraYOffset -= Math.sin(landPhase * Math.PI) * 0.3;
      this.jumpAnimationTime += deltaTime * 2;
      if (this.jumpAnimationTime >= 0) {
        this.jumpAnimationTime = 0;
      }
    }
    
    this.camera.position.copy(this.position);
    this.camera.position.y += cameraYOffset;

    // Apply friction
    this.velocity.x *= 0.9;
    this.velocity.z *= 0.9;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public setSensitivity(sensitivity: number): void {
    this.mouseSensitivity = sensitivity;
  }

  public getSensitivity(): number {
    return this.mouseSensitivity;
  }

  public reset(startPosition: THREE.Vector3): void {
    this.position = startPosition.clone();
    this.velocity.set(0, 0, 0);
    this.pitch = 0;
    this.yaw = 0;
    this.camera.position.copy(this.position);
    this.camera.rotation.set(0, 0, 0);
  }
}

